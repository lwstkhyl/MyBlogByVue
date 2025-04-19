// var winX = null;
// var winY = null;

// window.addEventListener('scroll', function () {
//     if (winX !== null && winY !== null) {
//         window.scrollTo(winX, winY);
//     }
// });

// export function disableWindowScroll() {
//     winX = window.scrollX;
//     winY = window.scrollY;
// }

// export function enableWindowScroll() {
//     winX = null;
//     winY = null;
// }
export function disableWindowScroll() {
    document.documentElement.style.overflowY = 'hidden'
}

export function enableWindowScroll() {
    document.documentElement.style.overflowY = 'auto'
}