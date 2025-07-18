export const openNewTag = (url) => {
    let a = document.getElementById('openNewTag');
    if (!a) {
        a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("target", "_blank");
        a.setAttribute("id", 'openNewTag');
        document.body.appendChild(a);
    } else {
        a.setAttribute("href", url);
    }
    a.click();
}