export function getUrlKey() {
    let obj = {};
    if (!window) { return; }
    let str = window.location.hash || '';
    if (str && str.split('?')[1]) {
        let queryArray = str.split('?')[1].split('&');
        queryArray.map((query) => {
            let temp = query.dplit('=');
            if (temp.length > 1) {
                obj[temp[0]] = temp[1];
            }
        })
    }
    return obj;
}
