export function loginCheck(title = "loginCheck", wrongMsg = "未登录", toPath = '/article') {
    this.$alert(wrongMsg, title, {
        confirmButtonText: '确定',
        callback: () => {
            this.$router.push(toPath);
        }
    });
}
