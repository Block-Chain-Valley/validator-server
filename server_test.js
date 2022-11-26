const cors = require("cors");

var express = require("express");
var app = express();
var dbConfig = require(__dirname + "/config/db.js");
var pool = dbConfig.getPool();
const port = 3000;

// 클라이언트로부터 받은 데이터 예시
/*  {type:'ADDRESS', 
    data:{chain_id: '001001', address:'0xqqqqq'}, 
    reporter:'0xzzzzz' }
*/

// 예시 : http://localhost:3000/makeNewReport?newReport={"type":"ADDRESS", "data":{"chain_id": "001001", "address" : "Oxeeeee"}, "reporter":"0xzzzzz"}
app.get("/makeNewReport", cors(), async (req, res) => {
    var params = req.query;
    var report_obj = JSON.parse(params.newReport);
    var messege;

    console.log("@@@@@@@@@@@@@@@@@@@@ 클라이언트 makeNewReport @@@@@@@@@@@@@@@@@@@@");
    console.log(report_obj);

    messege = await make_report(report_obj); //신고성공 or 에러메세지 반환

    res.send(messege);
});

//---------------------------------------------------------------------------------------------------------------------

//report 만드는 함수
//신고성공 -> 신고성공 반환, 신고실패 -> 에러 메세지 반환
async function make_report(report_obj) {
    var messege;

    if (report_obj.type == "ADDRESS") {
        messege = await address_report(report_obj); //신고성공 or 에러 리턴
    } else if (report_obj.type == "URL") {
        messege = await url_report(report_obj); //신고성공 or 에러 리턴
    } else {
        messege = `신고실패: 잘못된 type 입력(${report_obj.type})`;
    }

    return messege;
}

async function url_report(report_obj) {}

//ADDRESS 입력 받으면 신고횟수 반환
/*
0. 신고가능 여부 판단
1.  만약 ADDRESS 테이블에 CHAIN_ID와 ADDRESS 쌍이 없으면 (CHAIN_ID, ADDRESS, 1) 인서트;
    있으면 cnt ++;
2. REPORT 테이블에 (TYPE, CHAIN_ID, ADDRESS, '-', REPORTER, CURRENT_TIMESTAMP) 인서트;
*/
// 이거 사용
// 성공하면 리턴 없고, 실패하면 에러 리턴
async function address_report(report_obj) {
    var ok;

    var status = await report_ok(report_obj);

    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // report_ok()가 정상 실행되었으면
        if (status == "신고가능") {
            //해당 chain_id와 address가 기존에 신고된 횟수 파악. cnt
            var cnt = await same_report(report_obj);

            // same_report()가 정상 실행되었으면
            if (Number.isInteger(cnt)) {
                if (cnt == 0) {
                    //기존 신고가 없으면
                    var insertSql = `INSERT INTO ADDRESS VALUES("${report_obj.data.chain_id}","${report_obj.data.address}", 1)`;
                    const [rows] = await connection.query(insertSql);
                } else {
                    //기존 신고가 있으면
                    var updateSql = `UPDATE ADDRESS SET CNT = CNT + 1`;
                    updateSql = updateSql.concat(
                        ` WHERE CHAIN_ID = "${report_obj.data.chain_id}" AND ADDRESS = "${report_obj.data.address}"`,
                    );
                    const [rows] = await connection.query(updateSql);
                }

                // report 테이블 인서트
                var sql = `INSERT INTO REPORT VALUES('ADDRESS', "${report_obj.data.chain_id}",  "${report_obj.data.address}", '-',  "${report_obj.reporter}", CURRENT_TIMESTAMP)`;
                const [rows] = await connection.query(sql);

                await connection.commit();
                connection.release();

                ok = "신고성공";
                console.log("address_report 성공");
            } else {
                // same_report()가 정상 실행되지 않으면
                var ok = `same_report()에서 에러발생 : ${cnt}`;
                if (connection !== null) {
                    await connection.rollback(); //rollback
                    connection.release();
                }
                throw new Error(ok);
            }
        } else {
            // report_ok()가 정상 실행되지 않으면
            var ok = `report_ok()에서 에러발생 : ${status}`;
            if (connection !== null) {
                await connection.rollback(); //rollback
                connection.release();
            }
            throw new Error(ok);
        }
    } catch (error) {
        ok = `신고실패 : ${error}`;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        return ok;
    }
}

/*
async function address_report(report_obj) {
    var status = await report_ok(report_obj);

    try {
        if (status == "신고가능") {
            //해당 chain_id와 address가 기존에 신고된 횟수 파악. cnt
            var cnt = await same_report();

            if (Number.isInteger(cnt)) {
                if (cnt == 0) {
                    await first_report();
                } else {
                    await update_count();
                }

                // report 인서트
                await insert_report();
            } else {
                throw new Error(`same_report()에서 에러 발생 : ${cnt}`); //신고 불가능 사유
            }
        } else {
            throw new Error(`report_ok()에서 에러 발생 : ${status}`); //신고 불가능 사유
        }
    } catch (error) {}
}
*/

/* 
//성공하면 리턴 없고, 실패하면 error 리턴
async function first_report() {
    let connection = null;

    //(CHAIN_ID, ADDRESS, 1) 인서트
    var sql = `INSERT INTO ADDRESS VALUES("${report_obj.data.chain_id}","${report_obj.data.address}", 1)`;

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(sql);

        await connection.commit();
        connection.release();

        console.log("first_report 성공");
    } catch (error) {
        var ok = `first_report()에서 에러발생 : ${error}`;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        throw new Error(ok);
    }
}

//성공하면 리턴 없고, 실패하면 error 리턴
async function update_count() {
    let connection = null;

    //CNT 업데이트
    var sql = `UPDATE ADDRESS SET CNT = CNT + 1`;
    sql = sql.concat(` WHERE CHAIN_ID = "${report_obj.data.chain_id}" AND ADDRESS = "${report_obj.data.address}"`);

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(sql);

        await connection.commit();
        connection.release();

        console.log("update_count 성공");
    } catch (error) {
        var ok = `update_count()에서 에러발생 : ${error}`;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        throw new Error(ok);
    }
}

//성공하면 리턴 없고, 실패하면 error 리턴
async function insert_report() {
    let connection = null;

    // report 테이블 인서트
    var sql = `INSERT INTO REPORT VALUES('ADDRESS', "${report_obj.data.chain_id}",  "${report_obj.data.address}", '-',  "${report_obj.reporter}", CURRENT_TIMESTAMP)`;

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(sql);

        await connection.commit();
        connection.release();
        console.log("insert_report 성공");
    } catch (error) {
        var ok = `insert_report()에서 에러발생 : ${error}`;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        throw new Error(ok);
    }
}
*/

// 신고 횟수 리턴. cnt or error 리턴
async function same_report(report_obj) {
    var cnt;
    var ok;

    sql = ` SELECT COUNT(*) AS CNT FROM ADDRESS`;
    sql = sql.concat(` WHERE CHAIN_ID = "${report_obj.data.chain_id}"`);
    sql = sql.concat(` AND ADDRESS = "${report_obj.data.address}"`);
    /*
            SELECT COUNT(*) AS CNT FROM ADDRESS
            WHERE CHAIN_ID = '001001'
            AND ADDRESS = '0xqqqqq';
            */

    let connection = null;
    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(sql);

        cnt = rows[0].CNT;
        console.log("해당 chain_id와 address가 기존에 신고된 횟수 " + cnt);

        ok = cnt;

        await connection.commit();
        connection.release();
    } catch (error) {
        ok = `same_report()에서 에러발생 : ${error}`;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
    }
    return ok;
}

// 신고 가능한 상태인지 확인. 가능하면 '신고가능' 리턴
async function report_ok(report_obj) {
    var ok;
    var check1 = await duplicated(report_obj);
    var check2 = await today(report_obj);

    if (check1 == "최초신고" && check2 == "신고횟수잔존") {
        ok = "신고가능";
    } else {
        ok = `report_ok() -> 신고불가능 (사유 : ${check1} / ${check2})`;
    }
    console.log(ok);
    return ok;
}

//전에 들어온 신고인지 확인. 없으면 '최초신고'리턴.
async function duplicated(report_obj) {
    var sql;
    var ok;
    var cnt;

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

    let connection = null;
    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(sql);

        cnt = rows[0].CNT;
        console.log("해당 data가 기존에 신고된 횟수 " + cnt);

        await connection.commit();
        connection.release();

        if (cnt == 0) {
            ok = "최초신고";
        } else {
            throw new Error("중복된 신고");
        }
    } catch (error) {
        ok = error;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
    }

    return ok;
}

//오늘 누적 신고 가능 판단. 가능하면 '신고횟수잔존' 리턴.
async function today(report_obj) {
    var sql2;
    var ok;
    var cnt;
    var max_report = 10; //일일신고가능 횟수

    var today = new Date();

    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);

    var dateString = year + "-" + month + "-" + day; // 오늘 날짜 'yyyy-mm-dd';

    sql2 = ` SELECT COUNT(*) AS CNT FROM REPORT`;
    sql2 = sql2.concat(` WHERE REPORTER = "${report_obj.reporter}"`);
    sql2 = sql2.concat(` AND DATE_FORMAT(DATE, '%Y-%m-%d') = STR_TO_DATE("${dateString}", '%Y-%m-%d')`);

    let connection = null;
    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(sql2);

        cnt = rows[0].CNT;
        console.log("해당 사용자의 현재 일일 신고 횟수 " + cnt);

        if (cnt > max_report) {
            throw new Error("일일 신고 가능 횟수 초과");
        } else {
            ok = "신고횟수잔존";
        }

        await connection.commit();
        connection.release();
    } catch (error) {
        ok = error;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
    }

    return ok;
}

//오늘 전체 신고 횟수
/*
1. 오늘 DATE 파악
2. REPORT 테이블에서 DATE.00:00 ~ 현재시각까지 행 개수 리턴
*/

app.listen(port, () => console.log("포트 " + port + "번에서 시작"));

// 잘못된 입력 잡아내기 !!!!!!!!!!!!!!
// 최초 신고시 사유 입력 받기
