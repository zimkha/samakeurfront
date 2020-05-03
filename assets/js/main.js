 // smoth scroll
 // var scroll = new SmoothScroll('a[href*="#"]');

$(document).ready(function(){
    
    $(".active1 a").click(function() {
        console.log("bonjour");
        $(".active1 a").removeClass("active2");
        $(this).addClass("active2");
    });
});

lightbox.option({
    'fitImagesInViewport' : true,
    'disableScrolling' : true,
    'resizeDuration': 300,
    'positionFromTop': 120,
    'maxHeight': 800,
    'maxWidth' : 800
});

//  swipper
 var mySwiper = new Swiper ('.swiper-container', {
   // Optional parameters
   direction: 'horizontal',
   loop: true,
   speed: 400,
   spaceBetween: 100,
   effect: 'coverflow',
  // effect: 'cube', .// 'flip', 'fade', 'slide'
   init: true,

   // If we need pagination
   pagination: {
     el: '.swiper-pagination',
   },

   // Navigation arrows
   navigation: {
     nextEl: '.swiper-button-next',
     prevEl: '.swiper-button-prev',
   },

 // autoplay 
   autoplay: {
         delay: 5000,
     },

 });

 var mySwiper = new Swiper ('.swiper-container1', {
   // Optional parameters
   slidesPerView: 6,
   direction: 'horizontal',
   loop: true,
   speed: 400,
   spaceBetween: 100,
   effect: 'slide',
  // effect: 'cube', .// 'flip', 'fade', 'slide'
   init: true,

   pagination: {
    el: '.swiper-pagination1',
  },
   // Navigation arrows
   navigation: {
     nextEl: '.swiper-button-next1',
     prevEl: '.swiper-button-prev1',
   },

 // autoplay 
   autoplay: {
         delay: 4000,
     },
     // Responsive breakpoints
  breakpoints: {
    // when window width is >= 320px
    320: {
      slidesPerView: 1,
      spaceBetween: 20
    },
    // when window width is >= 480px
    480: {
      slidesPerView: 3,
      spaceBetween: 30
    },
    // when window width is >= 640px
    940: {
      slidesPerView: 6,
      spaceBetween: 100
    }
  }

 });
