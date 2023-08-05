const http = require('http');

const SID = process.argv[2]
const session = process.argv[3]
const SDID = process.argv[4]
let headers = {cookie: `UserKey=${SID};sessionId=${session}`,'Content-Type': 'application/json'}

function err(e){console.error(e);process.exit()}
function parseJson(json){ try {return JSON.parse(json)} catch (e){err(e)} }
function result(opt,body){
    return new Promise((resolve)=>{
        const req = http.request(opt,res => {
            let data=''
            res.on('data', (chunk) => {data += chunk});
            res.on('end',()=>{resolve(parseJson(data))})
        }).on('error',err)
        if (body) {req.write(body)}
        req.end()
    })
}

// 课程
function apiClass() {
    return result({
        hostname: 'jxky.web2.superchutou.com',
        port: 80,
        method: 'GET',
        path: '/service/eduSuper/Specialty/GetStuSpecialtyCurriculumList?StuDetail_ID=1AA487C561114D24911F1FD29CCC1766&IsStudyYear=1&StuID=64D06A1B86234FFC887032A8A2F8212C',
        headers
    })
}
// 阶段测评
function apiExam(classId) {
    return result({
        hostname: 'jxky.web2.superchutou.com',
        port: 80,
        method: 'GET',
        path: `/service/eduSuper/Question/GetStuStagePaperList?StuID=${SID}&ExamPaperType=3&Curriculum_ID=${classId}`,
        headers
    })
}
// 题目
function apiTopic(classId,examId) {
    return result({
        hostname: 'jxky.web2.superchutou.com',
        port: 80,
        method: 'GET',
        path: `/service/eduSuper/Question/GetExamPaperQuestions?examPaperId=${examId}&IsBegin=1&StuID=${SID}&StuDetail_ID=${SDID}&Examination_ID=0&Curriculum_ID=${classId}`,
        headers
    })
}
// 答题
function apiAction(resultId,list) {
    let body = JSON.stringify({
        "resultId":resultId,
        "list":list,
        "StuDetail_ID":SDID,
        "StuID":SID,
        "Examination_ID":"0"
    })
    return result({
        hostname: 'jxky.web2.superchutou.com',
        port: 80,
        method: 'POST',
        path: `/service/eduSuper/Question/SubmitSimplePractice`,
        headers
    },body)
}
// 解析
function apiAnswer(resultId,examId) {
    return result({
        hostname: 'jxky.web2.superchutou.com',
        port: 80,
        method: 'GET',
        path: `/service/eduSuper/Question/GetExamPaperResult?busId=${examId}&resultId=${resultId}`,
        headers
    })
}
// 交卷
function apiSubmit(classId,resultId,list) {
    let body = JSON.stringify({
        "resultId": resultId,
        "list": list,
        // "EndTime": 7119,
        "StuDetail_ID": SDID,
        "StuID": SID,
        "Examination_ID": "0",
        "Curriculum_ID": classId+""
    })
    return result({
        hostname: 'jxky.web2.superchutou.com',
        port: 80,
        method: 'POST',
        path: `/service/eduSuper/Question/SubmitExamPractice`,
        headers
    },body)
}

let core = []

async function getClass() {
    const json = await apiClass()
    return json.Data.list.map(e=>[e.Curriculum_ID,e.CuName])
}

(async function(){
    core = await getClass()
    for (const e of core) {
        const classId = e[0]
        const examJson = await apiExam(classId)
        const examData = examJson.Data[0]
        if (examData.MaxSorce === examData.AllScore){continue}
        const examId = examData.ExamPaper_ID
        const topicJson = await apiTopic(classId,examId)
        const resultId = topicJson.Data.ResultId
        const answerJson = await apiAnswer(resultId,examId)
        let answers = {}
        for (const e of answerJson.Data.QuestionType[0].Question) {
            answers[e.ID] = {
                "ID":e.ID,
                "MyAnswer":e.Answer,
                "Judge":0,
                "QuestionType_ID":e.QuestionType_ID,
                "FileJson":""
            }
        }
        const answerList = Object.values(answers);
        await apiAction(resultId,answerList)
        await apiSubmit(classId,resultId,answerList)
        console.log("完成: "+e[1])
    }
    console.log("运行结束!")
})()