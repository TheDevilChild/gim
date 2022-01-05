var swiper = new Swiper(".mySwiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    coverflowEffect: {
        rotate: 20,
        stretch: 0,
        depth: 200,
        modifier: 1,
        slideShadows: true
    },
    loop: true,
    centeredSlides: true,
    // autoplay: {
    //     delay: 3000,
    //     disableOnInteraction: false
    // },
    breakpoints: {
        // when window width is <= 320px
        320: {
            slidesPerView: 2,
            spaceBetween: 10
        },
        // when window width is <= 480px
        480: {
            slidesPerView: 2,
            spaceBetween: 20
        },
        // when window width is <= 640px
        640: {
            slidesPerView: 3,
            spaceBetween: 0
        }
    }

});