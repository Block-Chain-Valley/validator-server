const cors = require("cors");

var express = require("express");
var app = express();
var dbConfig = require(__dirname + "/config/db.js");
var connection = dbConfig.init();
const port = 3000;

// 클라이언트로부터 받은 데이터 예시
/*  {type:'ADDRESS', 
    data:{chain_id: '001001', address:'0xqqqqq'}, 
    reporter:'0xzzzzz' }
    혹은
    {type:'URL', 
    data:{url: 'www.11111'}, 
    reporter:'0xccccc' }
*/

// 예시 : http://localhost:3000/makeNewReport?newReport={"type":"URL", "data":{"url": "www.11111"}, "reporter":"0xvvvvv"}
app.get("/makeNewReport", cors(), (req, res) => {
    var params = req.query;
    var report_obj = JSON.parse(params.newReport);
    var messege;

    console.log("@@@@@@@@@@@@@@@@@@@@ 클라이언트 makeNewReport @@@@@@@@@@@@@@@@@@@@");
    console.log(report_obj);

    //비동기처리 필요
    messege = make_report(report_obj); //신고성공 or 에러메세지 반환

    res.send(messege);
});

//---------------------------------------------------------------------------------------------------------------------

//report 만드는 함수
//신고성공 -> 신고성공 반환, 신고실패 -> 에러 메세지 반환
function make_report(report_obj) {
    var messege;

    if (report_obj.type == "ADDRESS") {
        messege = address_report(report_obj); //신고성공 or 에러 리턴
    } else if (report_obj.type == "URL") {
        messege = url_report(report_obj); //신고성공 or 에러 리턴
    } else {
        messege = `신고실패: 잘못된 type 입력(${report_obj.type})`;
    }

    return messege;
}

//ADDRESS 입력 받으면 신고횟수 반환
/*
0. 신고가능 여부 판단
1.  만약 ADDRESS 테이블에 CHAIN_ID와 ADDRESS 쌍이 없으면 (CHAIN_ID, ADDRESS, 1) 인서트;
    있으면 cnt ++;
2. REPORT 테이블에 (TYPE, CHAIN_ID, ADDRESS, '-', REPORTER, CURRENT_TIMESTAMP) 인서트;
*/
function address_report(report_obj) {
    // 신고 성공, 신고 실패 반환

    var messege = "신고성공";

    try {
        if (report_ok(report_obj) == "신고가능") {
            //신고가능하면

            var cnt;

            sql = ` SELECT COUNT(*) AS CNT FROM ADDRESS`;
            sql = sql.concat(` WHERE CHAIN_ID = "${report_obj.data.chain_id}"`);
            sql = sql.concat(` AND ADDRESS = "${report_obj.data.address}"`);
            /*
            SELECT COUNT(*) AS CNT FROM ADDRESS
            WHERE CHAIN_ID = '001001'
            AND ADDRESS = '0xqqqqq';
            */

            connection.query(sql, (error, rows) => {
                if (error) {
                    throw new Error(error);
                }

                cnt = rows[0].CNT;
                console.log("해당 chain_id와 address가 기존에 신고된 횟수 " + cnt);
            });

            if (cnt == 0) {
                //만약 ADDRESS 테이블에 CHAIN_ID와 ADDRESS 쌍이 없으면

                //(CHAIN_ID, ADDRESS, 1) 인서트
                var sql = `INSERT INTO ADDRESS VALUES("${report_obj.data.chain_id}","${report_obj.data.address}", 1)`;

                connection.query(sql, (error, rows) => {
                    if (error) {
                        throw new Error(error);
                    } else {
                        connection.commit();
                    }
                });
            } else {
                //이미 있으면

                //CNT 업데이트
                var sql = `UPDATE ADDRESS SET CNT = CNT + 1`;
                sql = sql.concat(
                    ` WHERE CHAIN_ID = "${report_obj.data.chain_id}" AND ADDRESS = "${report_obj.data.address}"`,
                );

                connection.query(sql, (error, rows) => {
                    if (error) {
                        throw new Error(error);
                    }
                });
            }

            //REPORT 테이블에 ('ADDRESS', CHAIN_ID, ADDRESS, '-', REPORTER, CURRENT_TIMESTAMP) 인서트;
            var sql = `INSERT INTO REPORT VALUES('ADDRESS', "${report_obj.data.chain_id}",  "${report_obj.data.address}", '-',  "${report_obj.reporter}", CURRENT_TIMESTAMP)`;

            connection.query(sql, (error, rows) => {
                if (error) {
                    throw new Error(error);
                }
            });
        } else {
            throw new Error(report_ok(report_obj)); //신고 불가능 사유
        }
    } catch (err) {
        messege = `신고실패 : ${err}`;
    }

    return messege;
}

//URL 입력 받으면 신고횟수 반환
/*
0. 신고가능 여부 판단
1.  만약 ADDRESS 테이블에 URL이 없으면 (URL, 1) 인서트;
    있으면 cnt ++;
2.  REPORT 테이블에 (TYPE, '-', '-', URL, REPORTER, CURRENT_TIMESTAMP) 인서트;
3. cnt 반환
*/
function url_report(report_obj) {
    // 신고 성공, 신고 실패 반환

    var messege = "미정";

    try {
        if (report_ok(report_obj) == "신고가능") {
            var sql = ` SELECT COUNT(*) AS CNT FROM URL`;
            sql = sql.concat(` WHERE URL = "${report_obj.data.url}"`);
            /*
            SELECT COUNT(*) FROM URL
            WHERE URL = 'WWW.11111'
            */

            connection.query(sql, (error, rows) => {
                if (error) {
                    throw new Error(error);
                }

                var cnt = rows[0].CNT;
                console.log("해당 url이 기존에 신고된 횟수 " + cnt);

                if (cnt == 0) {
                    //만약 URL 테이블에 URL이 없으면

                    console.log("############################");

                    //(URL, 1) 인서트
                    var sql = `INSERT INTO URL VALUES("${report_obj.data.url}", 1)`;

                    connection.query(sql, (error, rows) => {
                        if (error) {
                            throw new Error(error);
                        } else {
                            console.log("insert ok");
                            connection.commit();
                        }
                    });
                } else {
                    //이미 있으면

                    //CNT 업데이트
                    var sql = `UPDATE URL SET CNT = CNT + 1`;
                    sql = sql.concat(` WHERE URL = "${report_obj.data.url}"`);

                    connection.query(sql, (error, rows) => {
                        if (error) {
                            throw new Error(error);
                        }
                    });
                }
            });

            //REPORT 테이블에 ('URL', '-', '-', URL, REPORTER, CURRENT_TIMESTAMP) 인서트;
            var insertSql = `INSERT INTO REPORT VALUES('URL', '-',  '-', "${report_obj.data.url}", "${report_obj.reporter}", CURRENT_TIMESTAMP)`;

            connection.query(insertSql, (error, rows) => {
                if (error) {
                    console.log("entered");
                    throw new Error(error);
                } else {
                    if (rows.length > 0) {
                        console.log("fxxked  1");
                    }
                    console.log("fxxked");
                }
            });
        } else {
            throw new Error(report_ok(report_obj)); //신고 불가능 사유
        }

        messege = "신고성공";
    } catch (err) {
        messege = `신고 실패 : ${err}`;
    }

    return messege;
}

// 신고 가능여부 판단 함수.
//'신고가능', '[신고불가능(사유: ${err})]' 리턴
function report_ok(report_obj) {
    // 매개변수: report 객체.

    var sql;
    var sql2;
    var ok = "신고가능"; //리턴;
    var max_report = 10; //일일 리포트 가능 횟수

    try {
        if (report_obj.type == "ADDRESS") {
            sql = ` SELECT COUNT(*) AS CNT FROM REPORT`;
            sql = sql.concat(` WHERE TYPE = 'ADDRESS'`);
            sql = sql.concat(` AND CHAIN_ID = "${report_obj.data.chain_id}"`);
            sql = sql.concat(` AND ADDRESS = "${report_obj.data.address}"`);
            sql = sql.concat(` AND REPORTER = "${report_obj.reporter}"`);
        } else {
            if (report_obj.type == "URL") {
                sql = ` SELECT COUNT(*) AS CNT FROM REPORT`;
                sql = sql.concat(` WHERE TYPE = 'URL'`);
                sql = sql.concat(` AND URL = "${report_obj.data.url}"`);
                sql = sql.concat(` AND REPORTER = "${report_obj.reporter}"`);
            }
        }

        //COUNT(*) = 0이 아니면, 즉 신고가 한번이라도 있었으면 신고 불가능 상태.
        connection.query(sql, (error, rows) => {
            if (error) {
                throw new Error(error);
            }
            console.log(rows);

            var cnt = rows[0].CNT;
            console.log("동일한 신고 횟수 " + cnt);

            if (cnt != 0) {
                throw new Error("동일 이용자에 의한 중복된 신고");
            }
        });

        var today = new Date();

        var year = today.getFullYear();
        var month = ("0" + (today.getMonth() + 1)).slice(-2);
        var day = ("0" + today.getDate()).slice(-2);

        var dateString = year + "-" + month + "-" + day; // 오늘 날짜 'yyyy-mm-dd';

        sql2 = ` SELECT COUNT(*) AS CNT FROM REPORT`;
        sql2 = sql2.concat(` WHERE REPORTER = "${report_obj.reporter}"`);
        sql2 = sql2.concat(` AND DATE_FORMAT(DATE, '%Y-%m-%d') = STR_TO_DATE("${dateString}", '%Y-%m-%d')`);
        /*
        SELECT COUNT(*) AS CNT FROM REPORT
        WHERE REPORTER = '0xzzzzz'
        AND DATE_FORMAT(DATE, '%Y-%m-%d') = STR_TO_DATE('2022-11-22', '%Y-%m-%d');
        */

        //COUNT(*) > max_report이면 하루 신고 한도 초과
        connection.query(sql2, (error, rows) => {
            if (error) {
                throw new Error(error);
            }

            var cnt = rows[0].CNT;
            console.log("해당 사용자의 현재 일일 신고 횟수 " + cnt);
            if (cnt > max_report) {
                throw new Error("일일 신고 가능 횟수 초과");
            }
        });
    } catch (err) {
        console.log("############### catch here ##################");
        ok = `[신고불가능(사유: ${err})]`;
    }

    return ok;
}

//오늘 전체 신고 횟수
/*
1. 오늘 DATE 파악
2. REPORT 테이블에서 DATE.00:00 ~ 현재시각까지 행 개수 리턴
*/

app.listen(port, () => console.log("포트 " + port + "번에서 시작"));
