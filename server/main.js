// 백엔드 메인

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cors({
    origins: "*"
}));

const __files = path.join(__dirname, "files");

const storage = multer.diskStorage({
    async destination(req, file, next) {

        // 랜덤한 6자리 숫자 키 만들기
        const generateKey = () => Math.floor(100000 + Math.random() * 900000).toString();

        let key = generateKey();

        while (await fs.pathExists(path.join(__files, key))) {
            key = generateKey();
        }

        await fs.mkdir(path.join(__files,key));

        req["dlKey"] = key;

        next(null, path.join(__files, key));
    },
    filename(req,file,next) {
        const filename = Buffer.from(file.originalname, 'latin1').toString('utf-8');
        next(null, filename)
    }
});

const upload = multer({ storage: storage });

app.get("/download/:key", async (req, res) => {
    const key = req.params.key;

    if (!/^\d{6}$/.test(key)) {
        return res.status(400).send("키가 올바르지 않습니다.");
    }

    if (await fs.pathExists(path.join(__files,key)) === false) {
        return res.status(404).send("파일을 찾을 수 없습니다.");
    }

    // 파일이 여러 개면 압축해서 전송
    const files = await fs.readdir(path.join(__files,key));

    console.log(`[파일 전송] [키: ${key}] [IP: ${req.ip}] 총 ${files.length}개의 파일 전송을 시작합니다.`);

    res.setHeader("Access-Control-Expose-Headers", "filename")

    const onFileSendComplete = async (err) => {
        if (err) {
            console.error(`[파일 전송 오류] [키: ${key}]:`, err);
        } else {
            console.log(`[파일 전송 완료] [키: ${key}] [IP: ${req.ip}] 총 ${files.length}개의 파일을 전송함.`);
        }

        // 파일 삭제
        await fs.rm(path.join(__files,key), { force: true, recursive: true });
    }

    if (files.length > 1) {
        res.setHeader('filename', `${key}.zip`)
        res.status(200).zip(path.join(__files, key), `${key}.zip`,onFileSendComplete);
    } else {
        const fileName = (await fs.readdir(path.join(__files, key)))[0];
        res.setHeader('filename',encodeURIComponent(fileName));
        res.status(200).download(path.join(__files, key, fileName), path.basename(fileName), onFileSendComplete);
    }
});

app.post("/upload", upload.array("files"), (req, res) => {

    const { dlKey } = req;
    const fileSize = req.files.reduce((acc, file) => acc + file.size, 0);

    console.log(`[업로드 완료] [IP: ${req.ip}] 키: ${dlKey}, 총 파일 크기: ${fileSize} B`);

    res.json({ dlKey });
});

app.listen(1234, () => {
    fs.emptyDirSync(__files)
    console.log("OpenShare 백엔드 시작");
});