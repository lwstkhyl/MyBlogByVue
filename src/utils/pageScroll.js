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
let scrollLockCount = 0;
let originalOverflowY = '';
let originalPaddingRight = '';

export function disableWindowScroll() {
    scrollLockCount++;
    if(scrollLockCount > 1) return;

    const documentElement = document.documentElement;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    originalOverflowY = documentElement.style.overflowY;
    originalPaddingRight = documentElement.style.paddingRight;
    documentElement.style.overflowY = 'hidden';

    if(scrollbarWidth > 0) {
        const paddingRight = parseFloat(window.getComputedStyle(documentElement).paddingRight) || 0;
        documentElement.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
    }
}

export function enableWindowScroll() {
    if(scrollLockCount === 0) return;
    scrollLockCount--;
    if(scrollLockCount > 0) return;

    document.documentElement.style.overflowY = originalOverflowY;
    document.documentElement.style.paddingRight = originalPaddingRight;
}
