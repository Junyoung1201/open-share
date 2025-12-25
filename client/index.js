const downloadFieldDiv = document.querySelector("#download-field");
const uploadFieldDiv = document.querySelector("#upload-field");
const gotoDownloadBtn = document.querySelector("#goto-download-btn");
const gotoUploadBtn = document.querySelector("#goto-upload-btn");
const fileInput = document.querySelector("input#file-input");

fileInput.addEventListener('change', (e) => {
    if (!e.target.files) {
        return;
    }

    const files = Array.from(e.target.files);
    const fileAmount = files.length;
    const fileSize = files.reduce((prev, cur) => prev + cur.size, 0);

    document.querySelector("#file-select").style.display = "none";
    document.querySelector("#file-selected").style.display = "inline-block";
    document.querySelector("span#fileSize").innerText = fileSize;
    document.querySelector("span#fileAmount").innerText = fileAmount;
})

window.onkeydown = (e) => {
    if (e.target.tagName === "INPUT" && e.target.parentElement.className === "key-input") {

        const inputArr = Array.from(document.querySelector("div.key-input").children)

        // 복사 붙여넣기
        if(e.key.toLowerCase() === "v" && e.ctrlKey) {
            setTimeout(() => {
                const pastedText = e.target.value;

                if(pastedText.length !== inputArr.length || isNaN(Number(pastedText))) {
                    alert("키가 올바르지 않습니다.");
                    return;
                }

                for(let i = 0; i < pastedText.length; i++) {
                    const c = pastedText[i];
                    inputArr[i].value = c;
                }

                inputArr[inputArr.length-1].focus();
            },2);
            return;
        }

        e.preventDefault();

        let myIndex = -1;

        for (let i = 0; i < inputArr.length; i++) {
            if (inputArr[i] === e.target) {
                myIndex = i;
                break;
            }
        }

        if (isNaN(Number(e.key))) {
            if (e.key === 'Backspace') {
                if (myIndex - 1 >= 0) {
                    e.target.value = "";
                    inputArr[myIndex - 1].focus();
                } else {
                    e.target.value = "";
                }
            }
        } else {
            e.target.value = e.key;

            if (myIndex + 1 < inputArr.length) {
                inputArr[myIndex + 1].focus();
            }
        }
    }
}

function copyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('복사 실패:', err);
    }

    document.body.removeChild(textarea);
}

document.querySelector("span#download-key").addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    copyText(e.target.textContent)
    alert(`다운로드 키(${e.target.textContent})를 복사했습니다.`)
})

gotoDownloadBtn.addEventListener('click', (e) => {
    downloadFieldDiv.style.display = "flex";
    uploadFieldDiv.style.display = "none";

    gotoDownloadBtn.setAttribute("selected", "");
    gotoUploadBtn.removeAttribute("selected");

    document.querySelector("div.key-input>input:first-child").focus();
});

gotoUploadBtn.addEventListener('click', (e) => {
    downloadFieldDiv.style.display = "none";
    uploadFieldDiv.style.display = "flex";

    gotoUploadBtn.setAttribute("selected", "")
    gotoDownloadBtn.removeAttribute("selected");
})


document.querySelector("#download-btn").addEventListener('click', (e) => {
    let dlKey = "";

    for (let el of Array.from(document.querySelector("div.key-input").children)) {
        if (el.tagName === "INPUT") {
            if (isNaN(Number(el.value))) {
                alert("올바르지 않은 다운로드 키 입니다.")
                return;
            }

            dlKey += el.value;
        }
    }

    fetch(`http://localhost:1234/download/${dlKey}`)
        .then(async (res) => {
            if (res.status !== 200) {
                const text = await res.text();
                alert(text);
                return;
            }

            const blob = await res.blob();
            const fileName = decodeURIComponent(res.headers.get("filename"));

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;

            document.body.appendChild(a);

            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(err => {
            console.error(err);
        })
})

document.querySelector("#upload-btn").addEventListener('click', (e) => {
    e.preventDefault();

    const body = new FormData();
    const files = fileInput.files;

    if (!files.length) {
        alert("업로드할 파일이 없습니다.")
        return;
    }

    for (let i = 0; i < files.length; i++) {
        body.append('files', files[i]);
    }

    fetch('http://localhost:1234/upload', {
        method: "POST",
        body
    })
        .then(res => res.json())
        .then(({ dlKey }) => {
            document.querySelector("#upload-complete").style.display = 'block';
            document.querySelector("span#download-key").innerText = dlKey
            document.querySelector("#file-select").style.display = 'none';
            document.querySelector("#file-selected").style.display = 'none';
        })
})