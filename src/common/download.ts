// This works in a codepen.io on Safari, but only with https (not localhost)
// https://www.codepel.com/demo/javascript-download-multiple-files/
export const forceDownload = (url: string, fileName: string) => {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", url, true)
    xhr.responseType = "blob"
    xhr.onload = function() {
        const tag = document.createElement("a")
        tag.href = URL.createObjectURL(this.response)
        tag.download = fileName
        document.body.appendChild(tag)
        tag.click()
        document.body.removeChild(tag)
    }
    xhr.send()
}