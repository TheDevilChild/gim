const card = document.querySelector('.card');

document.addEventListener('mousemove', function (e) {
    if(e.target.closest('.card')) {
        e.stopPropagation();
    }
    const ax = (window.innerWidth / 2 - e.pageX) / 20;
    const ay = (window.innerHeight / 2 - e.pageY) / 20;
    // document.documentElement.style.setProperty('--ax', ax);
    // document.documentElement.style.setProperty('--ay', ay);
    // let children = card.children;
    // for (let i = 0; i < children.length; i++) {
    //     children[i].style.transform = `translate(${ax}px, ${ay}px)`;
    // }
    card.setAttribute('style', "transform: rotateY("+ax+"deg) rotateX("+ay+"deg);-webkit-transform: rotateY("+ax+"deg) rotateX("+ay+"deg);-moz-transform: rotateY("+ax+"deg) rotateX("+ay+"deg)");
});