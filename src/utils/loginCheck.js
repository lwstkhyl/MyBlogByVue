export function loginCheck(vc, title = "loginCheck", wrongMsg = "未登录", toPath = '/article') {
    vc.$alert(wrongMsg, title, {
        confirmButtonText: '确定',
        callback: () => {
            vc.$router.push(toPath);
        }
    });
}
