jQuery.extend( jQuery.easing,
    {
        def: 'easeOutQuad',
        easeInOutExpo: function (x, t, b, c, d)
        {
            if (t==0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
            return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
        }
    });


+function ($)
{
    "use strict";

    String.prototype.replaceArray = function(find, replace) {
        var replaceString = this;
        var regex;
        for (var i = 0; i < find.length; i++) {
            regex = new RegExp(find[i], "g");
            replaceString = replaceString.replace(regex, replace[i] + "<br>");
        }
        return replaceString;
    };


    $(function(){

        /*$('.select2').select2();
        $('.timedropper').pickatime({
            format: 'HH:i',

            formatLabel: '<b>H</b>:i',
            formatSubmit: 'HH:i',
            hiddenName: true

        });

        $('#niveau').select2({
            placeholder: "Niveau ..."
        });

        // Format options
        $('.datedropper').pickadate({
            format: 'dd/mm/yyyy',
            formatSubmit: 'dd/mm/yyyy',
            monthsFull: [ 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre' ],
            monthsShort: [ 'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec' ],
            weekdaysShort: [ 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam' ],
            today: 'aujourd\'hui',
            clear: 'clair',
            close: 'Fermer'
        });
        */


        // Landing Scroll
        $(document).on('click.body','[data-ride="scroll"]',function (e)
        {
            e.preventDefault();
            e.stopPropagation();
            var $target = $(this).attr('data-href');
            $('html').stop().animate({
                'scrollTop': $($target).offset().top
            }, 1000, 'easeInOutExpo');
        });

        /*--
                class
        -----------------------------------*/
        $(document).on('click', '[data-toggle^="class"]', function (e) {
            e && e.preventDefault();
            var $this = $(e.target), $class, $target, $tmp, $classes, $targets;
            !$this.data('toggle') && ($this = $this.closest('[data-toggle^="class"]'));
            $class = $this.data()['toggle'];
            $target = $this.data('target') || $this.attr('href');
            $class && ($tmp = $class.split(':')[1]) && ($classes = $tmp.split(','));
            $target && ($targets = $target.split(','));
            $classes && $classes.length && $.each($targets, function (index, value) {
                if ($classes[index].indexOf('*') !== -1) {
                    var patt = new RegExp('\\s' +
                        $classes[index].replace(/\*/g, '[A-Za-z0-9-_]+').split(' ').join('\\s|\\s') +
                        '\\s', 'g');
                    $($this).each(function (i, it) {
                        var cn = ' ' + it.className + ' ';
                        while (patt.test(cn)) {
                            cn = cn.replace(patt, ' ');
                        }
                        it.className = $.trim(cn);
                    });
                }
                ($targets[index] != '#') && $($targets[index]).toggleClass($classes[index]) || $this.toggleClass($classes[index]);
            });
            $this.toggleClass('active');
        });


        /*--
        Scroll to top
        -----------------------------------*/

        $('.scroll-top').on('click', function () {
            $('html,body').animate({
                scrollTop: 0
            }, 2000);
        });

        $('.lire').click(function(){
            $('html, body').animate({
                scrollTop: $( $(this).attr('href') ).offset().top
            }, 500);
            return false;
        });

    /*    function toggleIcon(e) {
            alert("bonjour");
            $(e.target)
                .prev('.btn-primary')
                .find(".fa")
                .toggleClass('fa-plus fa-minus');
        };
        $('.active-mobile').on('hidden.bs.collapse', toggleIcon);
        $('.active-mobile').on('shown.bs.collapse', toggleIcon);*/

        $(document).ready(function(){
            // Add minus icon for collapse element which is open by default
            $(".collapse.show").each(function(){
                $(this).prev(".alert-accor").find(".fa").addClass("fa-minus").removeClass("fa-plus");
            });

            // Toggle plus minus icon on show hide of collapse element
            $(".collapse").on('show.bs.collapse', function(){
                $(this).prev(".alert-accor").find(".fa").removeClass("fa-plus").addClass("fa-minus");
            }).on('hide.bs.collapse', function(){
                $(this).prev(".alert-accor").find(".fa").removeClass("fa-minus").addClass("fa-plus");
            });
        });


        /*--
                blockui loading
        -----------------------------------*/
        if ($.blockUI)
        {
            $.fn.blockUI_start = function ()
            {
                $(this).block({
                    message: '<i class="fa fa-lg fa-refresh fa-spin"></i><br>Merci de patienter...' ,
                    css: {
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#fff',
                        padding: '30px',
                        width: '100%'
                    },
                    overlayCSS:  {
                        backgroundColor:	'#000',
                        opacity:			0.5
                    }
                });
            };

            $.fn.blockUI_stop = function ()
            {
                $(this).unblock();
            };
        }


        /*--
                serialize form to send data json
        -----------------------------------*/
        $.fn.serializeObject = function() {
            var o = {};

            var disabled = this.find(':input:disabled').removeAttr('disabled');
            var a = this.serializeArray();
            disabled.attr('disabled',true);

            $.each(a, function() {
                if (o[this.name]) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        };


        $.fn.validate = function(prefixeForm)
        {
            //var prefixeForm = $(this).attr('id').substr(8, $(this).attr('id').length-1);

            console.log('arrive ici', prefixeForm);

            var o = {};
            var a = this.serializeArray();
            var is_validate = true;
            $.each(a, function()
            {
                var itemValue = this.name + '_' + prefixeForm;
                var itemId = '#' + itemValue;
                var displayField = $('[for="'+ itemValue +'"]').html() ? $('[for="'+ itemValue +'"]').html() : this.name;

                try
                {
                    $(itemId).removeClass('border-danger');
                    if ($(itemId).hasClass('required') && !this.value)
                    {
                        $(itemId).addClass('border-danger');
                        iziToast.error({
                            title: "Formulaire",
                            message: "Renseignez le champ <span class=\"font-weight-bold text-capitalize\">" + displayField + "</span>",
                            position: 'topRight'
                        });
                        is_validate = false;
                    }
                }
                catch (e)
                {
                    console.log('validate =', e);
                }

                return is_validate;
            });


            if (is_validate)
                $.each(this.find('[id^="fichier_"]'), function () {
                    var itemValue = this.name + '_' + prefixeForm;
                    console.log(itemValue);
                    var itemId = '#' + itemValue;
                    var displayField = $('[for="'+ itemValue +'"]').html() ? $('[for="'+ itemValue +'"]').html() : this.name;
                    $(itemId).removeClass('border-danger');
                    if ($(itemId).hasClass('required') && !this.value)
                    {
                        $(itemId).addClass('border-danger');
                        iziToast.error({
                            title: "Formulaire",
                            message: "Choisir un fichier pour le champ <span class=\"font-weight-bold\">" + displayField + "</span>",
                            position: 'topRight'
                        });
                        is_validate = false;
                    }
                    return is_validate;
                });

            return is_validate;
        };


    });


}(window.jQuery);
