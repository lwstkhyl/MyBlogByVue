import { Message } from 'element-ui';

export const paste = async () => {
    try {
        const res = await navigator.clipboard.readText();
        Message({ message: "粘贴成功", type: 'success' });
        return res;
    } catch (err) {
        Message({ message: "粘贴失败", type: 'error' });
        return '';
    }
}

export const copy = (text) => {
    try {
        let $tempTextarea = document.createElement("textarea");
        $tempTextarea.value = text;
        document.body.appendChild($tempTextarea);
        $tempTextarea.select();
        document.execCommand("copy");
        $tempTextarea.remove();
        Message({ message: "复制成功", type: 'success' });
    } catch (err) {
        Message({ message: "复制失败", type: 'error' });
    }
}
