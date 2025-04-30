import Vue from 'vue'
import Hljs from 'highlight.js'
Hljs.configure({
    ignoreUnescapedHTML: true, //消除One of your code blocks includes unescaped HTML警告
});
let Highlight = function (Vue, options) {
    Vue.directive('highlight', function (el) {
        let blocks = el.querySelectorAll('pre code');
        blocks.forEach((block) => {
            block.removeAttribute('data-highlighted') //解决输出Element previously highlighted的问题
            let ul = document.createElement("ul");
            let rowCount = block.outerHTML.split('\n').length;
            for (let i = 1; i <= rowCount; i++) {
                let li = document.createElement("li")
                let text = document.createTextNode(i)
                li.appendChild(text)
                ul.appendChild(li)
            }
            ul.className = 'pre-numbering'
            block.parentNode.appendChild(ul)
            Hljs.highlightElement(block)
        })
    })
}
export default Highlight