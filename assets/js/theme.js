
$(function($) {

    var config = $('html').data('config') || {};

    // Social buttons
    /*$('article[data-permalink]').socialButtons(config);*/

    $.fn.exists = function() { return $(this).length; }


	$(document).ready(function () {


		if ( $('.owl-carousel').exists() ) {
			$(".slider-owl .owl-carousel").owlCarousel({ paginationSpeed : 400, slideSpeed : 400, singleItem:true, pagination:true, navigation : true, autoPlay: true, nav: true, margin:5, loop:true, autoplayTimeout:3500, autoplayHoverPause:true, stagePadding:0 });
		}	
		
		$('.numbersOnly').keyup(function () {  this.value = this.value.replace(/[^0-9]/g,''); });

	    $('.uk-label-checkbox').click(function(){
	    	$('.uk-label-checkbox').removeClass('checked');
	    	$(this).addClass('checked');

	    })


		if ( $('#uk-planning-grid').exists() ) {
			var uzrPagination = $.ias({ container: "#uk-planning-grid", item: ".uk-planning-line", pagination: ".yp_uzr_pagination", next: "li.pagination-next a" });
			uzrPagination.extension(new IASSpinnerExtension({html:'<div class="ias-spinner uk-display-block uk-width-1-1 uk-clearfix uk-margin-top uk-container-center " style="text-align: center;"><img src="{src}"/></div>'}));
			uzrPagination.extension(new IASTriggerExtension({offset: 1, text: Joomla.JText._('COM_OASIS_PAGINATION_VIEWMORE','Fin de liste'), html:'<div class="ias-trigger ias-trigger-next uk-width-1-1 uk-display-block" style="text-align:center"><a class="uk-button uk-button-medium uk-button-border-blue uk-notransform">{text}</a></div'}));
			uzrPagination.extension(new IASNoneLeftExtension({text: ""  }));
		}		

		$(function(){
			if ( $('#system-message-container .uk-alert').exists() ) { $('#system-message-container').slideDown().show(0).delay(5000).slideUp().fadeOut(0).delay(1000).hide(0); }
		})


    
	});


	$('a')
		.click(function (e) {
			e.preventDefault()
			$(this).tab('show')
		})



});


