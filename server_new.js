const cors = require("cors");

var express = require("express");
var app = express();
var dbConfig = require(__dirname + "/config/db.js");
var pool = dbConfig.getPool();
const port = 3000;

/*
//새로운 신고 보내는 경우
{project_name:'PROJECT_NAME', data:{chain_id: 'CHAIN_ID', address:'ADDRESS', url : 'URL'}, 
reason : 'REASON', reporter:'REPORTER', opinion: 'REPORT'}
// new_report() 사용
*/
/*
// 기존 신고에 추가하는 경우
{ project_name : '-', data:{chain_id: 'CHAIN_ID', address:'ADDRESS', url : 'URL'}, 
reason : '-', reporter:'REPORTER',  opinion: 'REPORT_OR_SAFE'}
// add_opinion(report) 사용
*/

//   http://localhost:3000/showAll?two={"chain_id":"CHAIN_ID", "address":"ADDRESS"}
app.get("/showAll", cors(), async (req, res) => {
    console.log("@@@@@@@@@@@@@@@@@@@@ start showAll @@@@@@@@@@@@@@@@@@@@");

    try {
        var params = req.query;
        var isTwo = params.hasOwnProperty("two");
        var rt;

        console.log(`hasOwnProperty("two") : ${isTwo}`);
        console.log(params);

        if (isTwo) {
            rt = await show_all(JSON.parse(params.two));
        } else {
            rt = await show_all("none");
        }

        var temp = JSON.parse(JSON.stringify(rt));
        temp.result = `${rt.result.total}개 행 리턴`;
        console.log(temp);
    } catch (error) {
        rt = `@/showAll: ${error.message}`;
    }
    res.send(rt);

    console.log("@@@@@@@@@@@@@@@@@@@@ end showAll @@@@@@@@@@@@@@@@@@@@");
});

//    http://localhost:3000/makeNewReport?newReport={"project_name":"t1", "data":{"chain_id": "eip155:1", "address":"0x11111", "url" : "www.!!!!!"}, "reason" : "scam", "reporter":"0xqqqqq","opinion": "REPORT"}
app.get("/makeNewReport", cors(), async (req, res) => {
    console.log("@@@@@@@@@@@@@@@@@@@@ start makeNewReport @@@@@@@@@@@@@@@@@@@@");

    try {
        var params = req.query;
        var report_obj = JSON.parse(params.newReport);
        var rt;

        console.log(report_obj);

        rt = await new_report(report_obj); //신고성공 or 에러메세지 반환
        console.log(rt);

        res.send(rt);
    } catch (error) {
        rt = `@/makeNewReport: ${error.message}`;
    }
    res.send(rt);

    console.log("@@@@@@@@@@@@@@@@@@@@ end makeNewReport @@@@@@@@@@@@@@@@@@@@");
});

async function show_all(two) {
    var two;
    var sql;

    let rt = {
        ok: false,
        msg: "",
        result: {},
    };

    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (two == "none") {
            sql = `SELECT R.PROJECT_NAME, A.CHAIN_ID, A.ADDRESS, A.URL, R.REASON, A.REPORT_CNT, A.SAFE_CNT
            FROM ADDRESS A
            INNER JOIN REPORT R
            ON A.CHAIN_ID = R.CHAIN_ID
            AND A.ADDRESS = R.ADDRESS
            AND A.URL = R.URL
            AND R.PROJECT_NAME IS NOT NULL
            AND R.REASON IS NOT NULL`;

            const [rows] = await connection.query(sql);
            var len = rows.length;
            rt.ok = true;
            rt.msg = `show_all() 정상실행[report 테이블 전체]`;
            rt.result.total = len;
            rt.result.data = rows;
        } else {
            if (two.chain_id && two.address) {
                sql = `SELECT R.PROJECT_NAME, A.CHAIN_ID, A.ADDRESS, A.URL, R.REASON, A.REPORT_CNT, A.SAFE_CNT
                FROM ADDRESS A
                INNER JOIN REPORT R
                ON A.CHAIN_ID = R.CHAIN_ID
                AND A.ADDRESS = R.ADDRESS
                AND A.URL = R.URL
                AND R.PROJECT_NAME IS NOT NULL
                AND R.REASON IS NOT NULL
                AND A.CHAIN_ID = "${two.chain_id}"
                AND A.ADDRESS = "${two.address}"`;

                const [rows] = await connection.query(sql);
                var len = rows.length;
                rt.ok = true;
                rt.msg = `show_all() 정상실행[chain_id: ${two.chain_id} / address: ${two.address}]`;
                rt.result.total = len;
                rt.result.data = rows;
            } else {
                throw new Error(`미입력 데이터 존재: [chain_id: ${two.chain_id} / address: ${two.address}]`);
            }
        }

        await connection.commit();
        connection.release();
    } catch (error) {
        rt.ok = false;
        rt.msg = `@show_all() 에러발생`;
        rt.result = error.message;
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        //console.log(`@show_all(): ${error}`);
    }

    return rt;
}

//"신고성공[최초신고]" or "신고성공[기존 신고에 opinion 추가]" or thorw(사유)
async function new_report(report_obj) {
    let rt = {
        ok: false,
        msg: "",
        result: null,
    };

    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        var _report_ok = await report_ok(report_obj); // //{ check: null, reason: { not_duplicated: null, today: null }, isError: { check: null, msg: "" } };

        if (_report_ok.check == true) {
            try {
                var _no_same_report = await no_same_report(report_obj);

                if (_no_same_report == true) {
                    var temp = await fisrt_report(report_obj, connection);

                    await connection.commit();
                    connection.release();

                    rt.ok = true;
                    rt.msg = temp;
                    //console.log("new_report 신고성공[최초신고]");
                } else {
                    var temp = await add_opinion(report_obj, connection);

                    await connection.commit();
                    connection.release();

                    rt.ok = true;
                    rt.msg = temp;
                    //console.log("new_report 신고성공[기존 신고에 opinion 추가]");
                }
            } catch (error) {
                if (connection !== null) {
                    await connection.rollback(); //rollback
                    connection.release();
                }
                rt.ok = false;
                rt.msg = `@new_report(신고실패) 1: ${error}`;
            }
        } else {
            if (_report_ok.isError.check == false) {
                rt.ok = false;
                rt.msg = `@new_report(신고실패): 동일 이용자에 의한 중복된 신고 아님 = ${_report_ok.reason.not_duplicated} / 일일 신고 횟수 남아있음 = ${_report_ok.reason.today}`;
            } else {
                rt.ok = false;
                rt.msg = `@new_report(신고실패) 2: ${_report_ok.isError.msg}`;
            }
        }
    } catch (error) {
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        rt.ok = false;
        rt.msg = `@new_report(신고실패) 3: ${error}`;
    }

    return rt;
}

// true or false or thorw
async function no_same_report(report_obj) {
    var cnt;

    var sql = ` SELECT COUNT(*) AS CNT FROM REPORT WHERE CHAIN_ID = "${report_obj.data.chain_id}" AND ADDRESS = "${report_obj.data.address}" AND URL = "${report_obj.data.url}"`;

    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(sql);
        cnt = rows[0].CNT;
        console.log("해당 chain_id와 address가 기존에 신고된 횟수 " + cnt);

        if (cnt == 0) {
            ok = true;
        } else {
            ok = false;
        }

        await connection.commit();
        connection.release();
    } catch (error) {
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        throw new Error(`@no_same_report: ${error}`);
    }
    return ok;
}

//{ check: null, reason: { not_duplicated: null, today: null }, isError: { check: null, msg: "" } };
async function report_ok(report_obj) {
    var ok_obj = { check: null, reason: { not_duplicated: null, today: null }, isError: { check: null, msg: "" } };

    var b1 = null;
    var b2 = null;

    try {
        b1 = await not_duplicated(report_obj);
        b2 = await today(report_obj);

        if (b1 && b2) {
            ok_obj.check = true;
        } else {
            ok_obj.check = false;
        }
        ok_obj.reason.not_duplicated = b1;
        ok_obj.reason.today = b2;
        ok_obj.isError.check = false;
    } catch (error) {
        ok_obj.check = false;
        ok_obj.isError.check = true;
        ok_obj.isError.msg = `@report_ok: ${error}`;
    }

    console.log(`동일 이용자에 의한 중복된 신고 아님 = ${b1} / 일일 신고 횟수 남아있음 = ${b2}`);
    return ok_obj;
}

// ture or false or throw
async function not_duplicated(report_obj) {
    var ok;
    var cnt;

    var sql = ` SELECT COUNT(*) AS CNT FROM REPORT WHERE CHAIN_ID = "${report_obj.data.chain_id}" AND ADDRESS = "${report_obj.data.address}" AND URL = "${report_obj.data.url}" AND REPORTER = "${report_obj.reporter}"`;

    let connection = null;
    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(sql);

        cnt = rows[0].CNT;
        console.log("해당 data가 동일 사용자에 의해 기존에 신고된 횟수 " + cnt);

        if (cnt == 0) {
            ok = true;
        } else {
            ok = false;
        }

        await connection.commit();
        connection.release();
    } catch (error) {
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        throw new Error(`@not_duplicated: ${error}`);
    }

    return ok;
}

// ture or false or throw
async function today(report_obj) {
    var ok;
    var cnt;
    var max_report = 7; //일일신고가능 횟수

    var today = new Date();

    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);

    var dateString = year + "-" + month + "-" + day; // 오늘 날짜 'yyyy-mm-dd';

    var sql = ` SELECT COUNT(*) AS CNT FROM REPORT WHERE REPORTER = "${report_obj.reporter}" AND DATE_FORMAT(DATE, '%Y-%m-%d') = STR_TO_DATE("${dateString}", '%Y-%m-%d')`;

    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(sql);
        cnt = rows[0].CNT;
        console.log("해당 사용자의 현재 일일 신고 횟수 " + cnt);

        if (cnt < max_report) {
            ok = true;
        } else {
            ok = false;
        }

        await connection.commit();
        connection.release();
    } catch (error) {
        if (connection !== null) {
            await connection.rollback(); //rollback
            connection.release();
        }
        throw new Error(`@today: ${error}`);
    }

    return ok;
}

// 첫번째 신고
// 성공하면 "fisrt_report() 성공"
// 실패하면 @fisrt_report() : ${error} THORW
async function fisrt_report(report_obj, conn) {
    var ok;

    let connection = null;
    try {
        connection = conn;

        var sql1 = `INSERT INTO ADDRESS VALUES("${report_obj.data.chain_id}","${report_obj.data.address}","${report_obj.data.url}", 1, 0)`;
        const [rows1] = await connection.query(sql1);

        var insertSql = `INSERT INTO REPORT VALUES("${report_obj.project_name}", "${report_obj.data.chain_id}",  "${report_obj.data.address}", "${report_obj.data.url}", "${report_obj.reason}", "${report_obj.reporter}", "REPORT", CURRENT_TIMESTAMP)`;
        const [rows2] = await connection.query(insertSql);

        ok = "fisrt_report() 성공";
        //console.log("fisrt_report() 성공");
    } catch (error) {
        ok = `@fisrt_report() : ${error}`;
        throw new Error(ok);
    }

    return ok;
}

// 의견 추가
// 성공하면 `add_opinion() 성공[${type}]`
// 실패하면 `@add_opinion() : ${error}` THORW
async function add_opinion(report_obj, conn) {
    var ok;
    var type = report_obj.opinion; // REPORT or SAFE

    let connection = null;
    try {
        connection = conn;

        var updateSql = `UPDATE ADDRESS SET ${type}_CNT = ${type}_CNT + 1 WHERE CHAIN_ID = "${report_obj.data.chain_id}" AND ADDRESS = "${report_obj.data.address}" AND URL = "${report_obj.data.url}"`;

        const [rows1] = await connection.query(updateSql);

        var insertSql = `INSERT INTO REPORT VALUES(NULL, "${report_obj.data.chain_id}", "${report_obj.data.address}", "${report_obj.data.url}", NULL, "${report_obj.reporter}", "${type}", CURRENT_TIMESTAMP)`;
        const [rows3] = await connection.query(insertSql);

        ok = `add_opinion() 성공[${type}]`;
        //console.log(`add_opinion() 성공[${type}]`);
    } catch (error) {
        ok = `@add_opinion() : ${error}`;
        throw new Error(ok);
    }
    return ok;
}

app.listen(port, () => console.log(`Server Running. . .[포트 ${port}번]`));

// 잘못된 파라매터 입력들어왔을 떄 막는 방법?
// swagger
