/*!
* FullCalendar v2.8.0
* Docs & License: http://fullcalendar.io/
* (c) 2016 Adam Shaw
*/
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'moment'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('jquery'), require('moment'));
    } else {
        factory(jQuery, moment);
    }
})(function ($, moment) {
    ;
    ;var FC = $.fullCalendar = {version: "2.8.0", internalApiVersion: 4};
    var fcViews = FC.views = {};
    $.fn.fullCalendar = function (options) {
        var args = Array.prototype.slice.call(arguments, 1);
        var res = this;
        this.each(function (i, _element) {
            var element = $(_element);
            var calendar = element.data('fullCalendar');
            var singleRes;
            if (typeof options === 'string') {
                if (calendar && $.isFunction(calendar[options])) {
                    singleRes = calendar[options].apply(calendar, args);
                    if (!i) {
                        res = singleRes;
                    }
                    if (options === 'destroy') {
                        element.removeData('fullCalendar');
                    }
                }
            } else if (!calendar) {
                calendar = new Calendar(element, options);
                element.data('fullCalendar', calendar);
                calendar.render();
            }
        });
        return res;
    };
    var complexOptions = ['header', 'buttonText', 'buttonIcons', 'themeButtonIcons'];

    function mergeOptions(optionObjs) {
        return mergeProps(optionObjs, complexOptions);
    }

    function massageOverrides(input) {
        var overrides = {views: input.views || {}};
        var subObj;
        $.each(input, function (name, val) {
            if (name != 'views') {
                if ($.isPlainObject(val) && !/(time|duration|interval)$/i.test(name) && $.inArray(name, complexOptions) == -1) {
                    subObj = null;
                    $.each(val, function (subName, subVal) {
                        if (/^(month|week|day|default|basic(Week|Day)?|agenda(Week|Day)?)$/.test(subName)) {
                            if (!overrides.views[subName]) {
                                overrides.views[subName] = {};
                            }
                            overrides.views[subName][name] = subVal;
                        } else {
                            if (!subObj) {
                                subObj = {};
                            }
                            subObj[subName] = subVal;
                        }
                    });
                    if (subObj) {
                        overrides[name] = subObj;
                    }
                } else {
                    overrides[name] = val;
                }
            }
        });
        return overrides;
    };
    ;FC.intersectRanges = intersectRanges;
    FC.applyAll = applyAll;
    FC.debounce = debounce;
    FC.isInt = isInt;
    FC.htmlEscape = htmlEscape;
    FC.cssToStr = cssToStr;
    FC.proxy = proxy;
    FC.capitaliseFirstLetter = capitaliseFirstLetter;

    function compensateScroll(rowEls, scrollbarWidths) {
        if (scrollbarWidths.left) {
            rowEls.css({'border-left-width': 1, 'margin-left': scrollbarWidths.left - 1});
        }
        if (scrollbarWidths.right) {
            rowEls.css({'border-right-width': 1, 'margin-right': scrollbarWidths.right - 1});
        }
    }

    function uncompensateScroll(rowEls) {
        rowEls.css({'margin-left': '', 'margin-right': '', 'border-left-width': '', 'border-right-width': ''});
    }

    function disableCursor() {
        $('body').addClass('fc-not-allowed');
    }

    function enableCursor() {
        $('body').removeClass('fc-not-allowed');
    }

    function distributeHeight(els, availableHeight, shouldRedistribute) {
        var minOffset1 = Math.floor(availableHeight / els.length);
        var minOffset2 = Math.floor(availableHeight - minOffset1 * (els.length - 1));
        var flexEls = [];
        var flexOffsets = [];
        var flexHeights = [];
        var usedHeight = 0;
        undistributeHeight(els);
        els.each(function (i, el) {
            var minOffset = i === els.length - 1 ? minOffset2 : minOffset1;
            var naturalOffset = $(el).outerHeight(true);
            if (naturalOffset < minOffset) {
                flexEls.push(el);
                flexOffsets.push(naturalOffset);
                flexHeights.push($(el).height());
            } else {
                usedHeight += naturalOffset;
            }
        });
        if (shouldRedistribute) {
            availableHeight -= usedHeight;
            minOffset1 = Math.floor(availableHeight / flexEls.length);
            minOffset2 = Math.floor(availableHeight - minOffset1 * (flexEls.length - 1));
        }
        $(flexEls).each(function (i, el) {
            var minOffset = i === flexEls.length - 1 ? minOffset2 : minOffset1;
            var naturalOffset = flexOffsets[i];
            var naturalHeight = flexHeights[i];
            var newHeight = minOffset - (naturalOffset - naturalHeight);
            if (naturalOffset < minOffset) {
                $(el).height(newHeight);
            }
        });
    }

    function undistributeHeight(els) {
        els.height('');
    }

    function matchCellWidths(els) {
        var maxInnerWidth = 0;
        els.find('> span').each(function (i, innerEl) {
            var innerWidth = $(innerEl).outerWidth();
            if (innerWidth > maxInnerWidth) {
                maxInnerWidth = innerWidth;
            }
        });
        maxInnerWidth++;
        els.width(maxInnerWidth);
        return maxInnerWidth;
    }

    function subtractInnerElHeight(outerEl, innerEl) {
        var both = outerEl.add(innerEl);
        var diff;
        both.css({position: 'relative', left: -1});
        diff = outerEl.outerHeight() - innerEl.outerHeight();
        both.css({position: '', left: ''});
        return diff;
    }

    FC.getOuterRect = getOuterRect;
    FC.getClientRect = getClientRect;
    FC.getContentRect = getContentRect;
    FC.getScrollbarWidths = getScrollbarWidths;

    function getScrollParent(el) {
        var position = el.css('position'), scrollParent = el.parents().filter(function () {
            var parent = $(this);
            return (/(auto|scroll)/).test(parent.css('overflow') + parent.css('overflow-y') + parent.css('overflow-x'));
        }).eq(0);
        return position === 'fixed' || !scrollParent.length ? $(el[0].ownerDocument || document) : scrollParent;
    }

    function getOuterRect(el, origin) {
        var offset = el.offset();
        var left = offset.left - (origin ? origin.left : 0);
        var top = offset.top - (origin ? origin.top : 0);
        return {left: left, right: left + el.outerWidth(), top: top, bottom: top + el.outerHeight()};
    }

    function getClientRect(el, origin) {
        var offset = el.offset();
        var scrollbarWidths = getScrollbarWidths(el);
        var left = offset.left + getCssFloat(el, 'border-left-width') + scrollbarWidths.left - (origin ? origin.left : 0);
        var top = offset.top + getCssFloat(el, 'border-top-width') + scrollbarWidths.top - (origin ? origin.top : 0);
        return {left: left, right: left + el[0].clientWidth, top: top, bottom: top + el[0].clientHeight};
    }

    function getContentRect(el, origin) {
        var offset = el.offset();
        var left = offset.left + getCssFloat(el, 'border-left-width') + getCssFloat(el, 'padding-left') -
            (origin ? origin.left : 0);
        var top = offset.top + getCssFloat(el, 'border-top-width') + getCssFloat(el, 'padding-top') -
            (origin ? origin.top : 0);
        return {left: left, right: left + el.width(), top: top, bottom: top + el.height()};
    }

    function getScrollbarWidths(el) {
        var leftRightWidth = el.innerWidth() - el[0].clientWidth;
        var widths = {left: 0, right: 0, top: 0, bottom: el.innerHeight() - el[0].clientHeight};
        if (getIsLeftRtlScrollbars() && el.css('direction') == 'rtl') {
            widths.left = leftRightWidth;
        } else {
            widths.right = leftRightWidth;
        }
        return widths;
    }

    var _isLeftRtlScrollbars = null;

    function getIsLeftRtlScrollbars() {
        if (_isLeftRtlScrollbars === null) {
            _isLeftRtlScrollbars = computeIsLeftRtlScrollbars();
        }
        return _isLeftRtlScrollbars;
    }

    function computeIsLeftRtlScrollbars() {
        var el = $('<div><div/></div>').css({
            position: 'absolute',
            top: -1000,
            left: 0,
            border: 0,
            padding: 0,
            overflow: 'scroll',
            direction: 'rtl'
        }).appendTo('body');
        var innerEl = el.children();
        var res = innerEl.offset().left > el.offset().left;
        el.remove();
        return res;
    }

    function getCssFloat(el, prop) {
        return parseFloat(el.css(prop)) || 0;
    }

    FC.preventDefault = preventDefault;

    function isPrimaryMouseButton(ev) {
        return ev.which == 1 && !ev.ctrlKey;
    }

    function getEvX(ev) {
        if (ev.pageX !== undefined) {
            return ev.pageX;
        }
        var touches = ev.originalEvent.touches;
        if (touches) {
            return touches[0].pageX;
        }
    }

    function getEvY(ev) {
        if (ev.pageY !== undefined) {
            return ev.pageY;
        }
        var touches = ev.originalEvent.touches;
        if (touches) {
            return touches[0].pageY;
        }
    }

    function getEvIsTouch(ev) {
        return /^touch/.test(ev.type);
    }

    function preventSelection(el) {
        el.addClass('fc-unselectable').on('selectstart', preventDefault);
    }

    function preventDefault(ev) {
        ev.preventDefault();
    }

    function bindAnyScroll(handler) {
        if (window.addEventListener) {
            window.addEventListener('scroll', handler, true);
            return true;
        }
        return false;
    }

    function unbindAnyScroll(handler) {
        if (window.removeEventListener) {
            window.removeEventListener('scroll', handler, true);
            return true;
        }
        return false;
    }

    FC.intersectRects = intersectRects;

    function intersectRects(rect1, rect2) {
        var res = {
            left: Math.max(rect1.left, rect2.left),
            right: Math.min(rect1.right, rect2.right),
            top: Math.max(rect1.top, rect2.top),
            bottom: Math.min(rect1.bottom, rect2.bottom)
        };
        if (res.left < res.right && res.top < res.bottom) {
            return res;
        }
        return false;
    }

    function constrainPoint(point, rect) {
        return {
            left: Math.min(Math.max(point.left, rect.left), rect.right),
            top: Math.min(Math.max(point.top, rect.top), rect.bottom)
        };
    }

    function getRectCenter(rect) {
        return {left: (rect.left + rect.right) / 2, top: (rect.top + rect.bottom) / 2};
    }

    function diffPoints(point1, point2) {
        return {left: point1.left - point2.left, top: point1.top - point2.top};
    }

    FC.parseFieldSpecs = parseFieldSpecs;
    FC.compareByFieldSpecs = compareByFieldSpecs;
    FC.compareByFieldSpec = compareByFieldSpec;
    FC.flexibleCompare = flexibleCompare;

    function parseFieldSpecs(input) {
        var specs = [];
        var tokens = [];
        var i, token;
        if (typeof input === 'string') {
            tokens = input.split(/\s*,\s*/);
        } else if (typeof input === 'function') {
            tokens = [input];
        } else if ($.isArray(input)) {
            tokens = input;
        }
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            if (typeof token === 'string') {
                specs.push(token.charAt(0) == '-' ? {field: token.substring(1), order: -1} : {field: token, order: 1});
            } else if (typeof token === 'function') {
                specs.push({func: token});
            }
        }
        return specs;
    }

    function compareByFieldSpecs(obj1, obj2, fieldSpecs) {
        var i;
        var cmp;
        for (i = 0; i < fieldSpecs.length; i++) {
            cmp = compareByFieldSpec(obj1, obj2, fieldSpecs[i]);
            if (cmp) {
                return cmp;
            }
        }
        return 0;
    }

    function compareByFieldSpec(obj1, obj2, fieldSpec) {
        if (fieldSpec.func) {
            return fieldSpec.func(obj1, obj2);
        }
        return flexibleCompare(obj1[fieldSpec.field], obj2[fieldSpec.field]) * (fieldSpec.order || 1);
    }

    function flexibleCompare(a, b) {
        if (!a && !b) {
            return 0;
        }
        if (b == null) {
            return -1;
        }
        if (a == null) {
            return 1;
        }
        if ($.type(a) === 'string' || $.type(b) === 'string') {
            return String(a).localeCompare(String(b));
        }
        return a - b;
    }

    function intersectRanges(subjectRange, constraintRange) {
        var subjectStart = subjectRange.start;
        var subjectEnd = subjectRange.end;
        var constraintStart = constraintRange.start;
        var constraintEnd = constraintRange.end;
        var segStart, segEnd;
        var isStart, isEnd;
        if (subjectEnd > constraintStart && subjectStart < constraintEnd) {
            if (subjectStart >= constraintStart) {
                segStart = subjectStart.clone();
                isStart = true;
            } else {
                segStart = constraintStart.clone();
                isStart = false;
            }
            if (subjectEnd <= constraintEnd) {
                segEnd = subjectEnd.clone();
                isEnd = true;
            } else {
                segEnd = constraintEnd.clone();
                isEnd = false;
            }
            return {start: segStart, end: segEnd, isStart: isStart, isEnd: isEnd};
        }
    }

    FC.computeIntervalUnit = computeIntervalUnit;
    FC.divideRangeByDuration = divideRangeByDuration;
    FC.divideDurationByDuration = divideDurationByDuration;
    FC.multiplyDuration = multiplyDuration;
    FC.durationHasTime = durationHasTime;
    var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var intervalUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

    function diffDayTime(a, b) {
        return moment.duration({
            days: a.clone().stripTime().diff(b.clone().stripTime(), 'days'),
            ms: a.time() - b.time()
        });
    }

    function diffDay(a, b) {
        return moment.duration({days: a.clone().stripTime().diff(b.clone().stripTime(), 'days')});
    }

    function diffByUnit(a, b, unit) {
        return moment.duration(Math.round(a.diff(b, unit, true)), unit);
    }

    function computeIntervalUnit(start, end) {
        var i, unit;
        var val;
        for (i = 0; i < intervalUnits.length; i++) {
            unit = intervalUnits[i];
            val = computeRangeAs(unit, start, end);
            if (val >= 1 && isInt(val)) {
                break;
            }
        }
        return unit;
    }

    function computeRangeAs(unit, start, end) {
        if (end != null) {
            return end.diff(start, unit, true);
        } else if (moment.isDuration(start)) {
            return start.as(unit);
        } else {
            return start.end.diff(start.start, unit, true);
        }
    }

    function divideRangeByDuration(start, end, dur) {
        var months;
        if (durationHasTime(dur)) {
            return (end - start) / dur;
        }
        months = dur.asMonths();
        if (Math.abs(months) >= 1 && isInt(months)) {
            return end.diff(start, 'months', true) / months;
        }
        return end.diff(start, 'days', true) / dur.asDays();
    }

    function divideDurationByDuration(dur1, dur2) {
        var months1, months2;
        if (durationHasTime(dur1) || durationHasTime(dur2)) {
            return dur1 / dur2;
        }
        months1 = dur1.asMonths();
        months2 = dur2.asMonths();
        if (Math.abs(months1) >= 1 && isInt(months1) && Math.abs(months2) >= 1 && isInt(months2)) {
            return months1 / months2;
        }
        return dur1.asDays() / dur2.asDays();
    }

    function multiplyDuration(dur, n) {
        var months;
        if (durationHasTime(dur)) {
            return moment.duration(dur * n);
        }
        months = dur.asMonths();
        if (Math.abs(months) >= 1 && isInt(months)) {
            return moment.duration({months: months * n});
        }
        return moment.duration({days: dur.asDays() * n});
    }

    function durationHasTime(dur) {
        return Boolean(dur.hours() || dur.minutes() || dur.seconds() || dur.milliseconds());
    }

    function isNativeDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
    }

    function isTimeString(str) {
        return /^\d+\:\d+(?:\:\d+\.?(?:\d{3})?)?$/.test(str);
    }

    FC.log = function () {
        var console = window.console;
        if (console && console.log) {
            return console.log.apply(console, arguments);
        }
    };
    FC.warn = function () {
        var console = window.console;
        if (console && console.warn) {
            return console.warn.apply(console, arguments);
        } else {
            return FC.log.apply(FC, arguments);
        }
    };
    var hasOwnPropMethod = {}.hasOwnProperty;

    function mergeProps(propObjs, complexProps) {
        var dest = {};
        var i, name;
        var complexObjs;
        var j, val;
        var props;
        if (complexProps) {
            for (i = 0; i < complexProps.length; i++) {
                name = complexProps[i];
                complexObjs = [];
                for (j = propObjs.length - 1; j >= 0; j--) {
                    val = propObjs[j][name];
                    if (typeof val === 'object') {
                        complexObjs.unshift(val);
                    } else if (val !== undefined) {
                        dest[name] = val;
                        break;
                    }
                }
                if (complexObjs.length) {
                    dest[name] = mergeProps(complexObjs);
                }
            }
        }
        for (i = propObjs.length - 1; i >= 0; i--) {
            props = propObjs[i];
            for (name in props) {
                if (!(name in dest)) {
                    dest[name] = props[name];
                }
            }
        }
        return dest;
    }

    function createObject(proto) {
        var f = function () {
        };
        f.prototype = proto;
        return new f();
    }

    function copyOwnProps(src, dest) {
        for (var name in src) {
            if (hasOwnProp(src, name)) {
                dest[name] = src[name];
            }
        }
    }

    function copyNativeMethods(src, dest) {
        var names = ['constructor', 'toString', 'valueOf'];
        var i, name;
        for (i = 0; i < names.length; i++) {
            name = names[i];
            if (src[name] !== Object.prototype[name]) {
                dest[name] = src[name];
            }
        }
    }

    function hasOwnProp(obj, name) {
        return hasOwnPropMethod.call(obj, name);
    }

    function isAtomic(val) {
        return /undefined|null|boolean|number|string/.test($.type(val));
    }

    function applyAll(functions, thisObj, args) {
        if ($.isFunction(functions)) {
            functions = [functions];
        }
        if (functions) {
            var i;
            var ret;
            for (i = 0; i < functions.length; i++) {
                ret = functions[i].apply(thisObj, args) || ret;
            }
            return ret;
        }
    }

    function firstDefined() {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined) {
                return arguments[i];
            }
        }
    }

    function htmlEscape(s) {
        return (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace('|', '<span>').replace('~', '</span>').replace(/\n/g, '<br />');
    }

    function stripHtmlEntities(text) {
        return text.replace(/&.*?;/g, '');
    }

    function cssToStr(cssProps) {
        var statements = [];
        $.each(cssProps, function (name, val) {
            if (val != null) {
                statements.push(name + ':' + val);
            }
        });
        return statements.join(';');
    }

    function capitaliseFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function compareNumbers(a, b) {
        return a - b;
    }

    function isInt(n) {
        return n % 1 === 0;
    }

    function proxy(obj, methodName) {
        var method = obj[methodName];
        return function () {
            return method.apply(obj, arguments);
        };
    }

    function debounce(func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        var later = function () {
            var last = +new Date() - timestamp;
            if (last < wait) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    context = args = null;
                }
            }
        };
        return function () {
            context = this;
            args = arguments;
            timestamp = +new Date();
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }
            return result;
        };
    }

    function syncThen(promise, thenFunc) {
        if (!promise || !promise.then || promise.state() === 'resolved') {
            return $.when(thenFunc());
        } else if (thenFunc) {
            return promise.then(thenFunc);
        }
    };
    ;var ambigDateOfMonthRegex = /^\s*\d{4}-\d\d$/;
    var ambigTimeOrZoneRegex = /^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?)?$/;
    var newMomentProto = moment.fn;
    var oldMomentProto = $.extend({}, newMomentProto);
    var allowValueOptimization;
    var setUTCValues;
    var setLocalValues;
    FC.moment = function () {
        return makeMoment(arguments);
    };
    FC.moment.utc = function () {
        var mom = makeMoment(arguments, true);
        if (mom.hasTime()) {
            mom.utc();
        }
        return mom;
    };
    FC.moment.parseZone = function () {
        return makeMoment(arguments, true, true);
    };

    function makeMoment(args, parseAsUTC, parseZone) {
        var input = args[0];
        var isSingleString = args.length == 1 && typeof input === 'string';
        var isAmbigTime;
        var isAmbigZone;
        var ambigMatch;
        var mom;
        if (moment.isMoment(input)) {
            mom = moment.apply(null, args);
            transferAmbigs(input, mom);
        } else if (isNativeDate(input) || input === undefined) {
            mom = moment.apply(null, args);
        } else {
            isAmbigTime = false;
            isAmbigZone = false;
            if (isSingleString) {
                if (ambigDateOfMonthRegex.test(input)) {
                    input += '-01';
                    args = [input];
                    isAmbigTime = true;
                    isAmbigZone = true;
                } else if ((ambigMatch = ambigTimeOrZoneRegex.exec(input))) {
                    isAmbigTime = !ambigMatch[5];
                    isAmbigZone = true;
                }
            } else if ($.isArray(input)) {
                isAmbigZone = true;
            }
            if (parseAsUTC || isAmbigTime) {
                mom = moment.utc.apply(moment, args);
            } else {
                mom = moment.apply(null, args);
            }
            if (isAmbigTime) {
                mom._ambigTime = true;
                mom._ambigZone = true;
            } else if (parseZone) {
                if (isAmbigZone) {
                    mom._ambigZone = true;
                } else if (isSingleString) {
                    if (mom.utcOffset) {
                        mom.utcOffset(input);
                    } else {
                        mom.zone(input);
                    }
                }
            }
        }
        mom._fullCalendar = true;
        return mom;
    }

    newMomentProto.clone = function () {
        var mom = oldMomentProto.clone.apply(this, arguments);
        transferAmbigs(this, mom);
        if (this._fullCalendar) {
            mom._fullCalendar = true;
        }
        return mom;
    };
    newMomentProto.week = newMomentProto.weeks = function (input) {
        var weekCalc = (this._locale || this._lang)._fullCalendar_weekCalc;
        if (input == null && typeof weekCalc === 'function') {
            return weekCalc(this);
        } else if (weekCalc === 'ISO') {
            return oldMomentProto.isoWeek.apply(this, arguments);
        }
        return oldMomentProto.week.apply(this, arguments);
    };
    newMomentProto.time = function (time) {
        if (!this._fullCalendar) {
            return oldMomentProto.time.apply(this, arguments);
        }
        if (time == null) {
            return moment.duration({
                hours: this.hours(),
                minutes: this.minutes(),
                seconds: this.seconds(),
                milliseconds: this.milliseconds()
            });
        } else {
            this._ambigTime = false;
            if (!moment.isDuration(time) && !moment.isMoment(time)) {
                time = moment.duration(time);
            }
            var dayHours = 0;
            if (moment.isDuration(time)) {
                dayHours = Math.floor(time.asDays()) * 24;
            }
            return this.hours(dayHours + time.hours()).minutes(time.minutes()).seconds(time.seconds()).milliseconds(time.milliseconds());
        }
    };
    newMomentProto.stripTime = function () {
        var a;
        if (!this._ambigTime) {
            a = this.toArray();
            this.utc();
            setUTCValues(this, a.slice(0, 3));
            this._ambigTime = true;
            this._ambigZone = true;
        }
        return this;
    };
    newMomentProto.hasTime = function () {
        return !this._ambigTime;
    };
    newMomentProto.stripZone = function () {
        var a, wasAmbigTime;
        if (!this._ambigZone) {
            a = this.toArray();
            wasAmbigTime = this._ambigTime;
            this.utc();
            setUTCValues(this, a);
            this._ambigTime = wasAmbigTime || false;
            this._ambigZone = true;
        }
        return this;
    };
    newMomentProto.hasZone = function () {
        return !this._ambigZone;
    };
    newMomentProto.local = function () {
        var a = this.toArray();
        var wasAmbigZone = this._ambigZone;
        oldMomentProto.local.apply(this, arguments);
        this._ambigTime = false;
        this._ambigZone = false;
        if (wasAmbigZone) {
            setLocalValues(this, a);
        }
        return this;
    };
    newMomentProto.utc = function () {
        oldMomentProto.utc.apply(this, arguments);
        this._ambigTime = false;
        this._ambigZone = false;
        return this;
    };
    $.each(['zone', 'utcOffset'], function (i, name) {
        if (oldMomentProto[name]) {
            newMomentProto[name] = function (tzo) {
                if (tzo != null) {
                    this._ambigTime = false;
                    this._ambigZone = false;
                }
                return oldMomentProto[name].apply(this, arguments);
            };
        }
    });
    newMomentProto.format = function () {
        if (this._fullCalendar && arguments[0]) {
            return formatDate(this, arguments[0]);
        }
        if (this._ambigTime) {
            return oldMomentFormat(this, 'YYYY-MM-DD');
        }
        if (this._ambigZone) {
            return oldMomentFormat(this, 'YYYY-MM-DD[T]HH:mm:ss');
        }
        return oldMomentProto.format.apply(this, arguments);
    };
    newMomentProto.toISOString = function () {
        if (this._ambigTime) {
            return oldMomentFormat(this, 'YYYY-MM-DD');
        }
        if (this._ambigZone) {
            return oldMomentFormat(this, 'YYYY-MM-DD[T]HH:mm:ss');
        }
        return oldMomentProto.toISOString.apply(this, arguments);
    };
    newMomentProto.isWithin = function (start, end) {
        var a = commonlyAmbiguate([this, start, end]);
        return a[0] >= a[1] && a[0] < a[2];
    };
    newMomentProto.isSame = function (input, units) {
        var a;
        if (!this._fullCalendar) {
            return oldMomentProto.isSame.apply(this, arguments);
        }
        if (units) {
            a = commonlyAmbiguate([this, input], true);
            return oldMomentProto.isSame.call(a[0], a[1], units);
        } else {
            input = FC.moment.parseZone(input);
            return oldMomentProto.isSame.call(this, input) && Boolean(this._ambigTime) === Boolean(input._ambigTime) && Boolean(this._ambigZone) === Boolean(input._ambigZone);
        }
    };
    $.each(['isBefore', 'isAfter'], function (i, methodName) {
        newMomentProto[methodName] = function (input, units) {
            var a;
            if (!this._fullCalendar) {
                return oldMomentProto[methodName].apply(this, arguments);
            }
            a = commonlyAmbiguate([this, input]);
            return oldMomentProto[methodName].call(a[0], a[1], units);
        };
    });

    function commonlyAmbiguate(inputs, preserveTime) {
        var anyAmbigTime = false;
        var anyAmbigZone = false;
        var len = inputs.length;
        var moms = [];
        var i, mom;
        for (i = 0; i < len; i++) {
            mom = inputs[i];
            if (!moment.isMoment(mom)) {
                mom = FC.moment.parseZone(mom);
            }
            anyAmbigTime = anyAmbigTime || mom._ambigTime;
            anyAmbigZone = anyAmbigZone || mom._ambigZone;
            moms.push(mom);
        }
        for (i = 0; i < len; i++) {
            mom = moms[i];
            if (!preserveTime && anyAmbigTime && !mom._ambigTime) {
                moms[i] = mom.clone().stripTime();
            } else if (anyAmbigZone && !mom._ambigZone) {
                moms[i] = mom.clone().stripZone();
            }
        }
        return moms;
    }

    function transferAmbigs(src, dest) {
        if (src._ambigTime) {
            dest._ambigTime = true;
        } else if (dest._ambigTime) {
            dest._ambigTime = false;
        }
        if (src._ambigZone) {
            dest._ambigZone = true;
        } else if (dest._ambigZone) {
            dest._ambigZone = false;
        }
    }

    function setMomentValues(mom, a) {
        mom.year(a[0] || 0).month(a[1] || 0).date(a[2] || 0).hours(a[3] || 0).minutes(a[4] || 0).seconds(a[5] || 0).milliseconds(a[6] || 0);
    }

    allowValueOptimization = '_d' in moment() && 'updateOffset' in moment;
    setUTCValues = allowValueOptimization ? function (mom, a) {
        mom._d.setTime(Date.UTC.apply(Date, a));
        moment.updateOffset(mom, false);
    } : setMomentValues;
    setLocalValues = allowValueOptimization ? function (mom, a) {
        mom._d.setTime(+new Date(a[0] || 0, a[1] || 0, a[2] || 0, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0));
        moment.updateOffset(mom, false);
    } : setMomentValues;
    ;
    ;

    function oldMomentFormat(mom, formatStr) {
        return oldMomentProto.format.call(mom, formatStr);
    }

    function formatDate(date, formatStr) {
        return formatDateWithChunks(date, getFormatStringChunks(formatStr));
    }

    function formatDateWithChunks(date, chunks) {
        var s = '';
        var i;
        for (i = 0; i < chunks.length; i++) {
            s += formatDateWithChunk(date, chunks[i]);
        }
        return s;
    }

    var tokenOverrides = {
        t: function (date) {
            return oldMomentFormat(date, 'a').charAt(0);
        }, T: function (date) {
            return oldMomentFormat(date, 'A').charAt(0);
        }
    };

    function formatDateWithChunk(date, chunk) {
        var token;
        var maybeStr;
        if (typeof chunk === 'string') {
            return chunk;
        } else if ((token = chunk.token)) {
            if (tokenOverrides[token]) {
                return tokenOverrides[token](date);
            }
            return oldMomentFormat(date, token);
        } else if (chunk.maybe) {
            maybeStr = formatDateWithChunks(date, chunk.maybe);
            if (maybeStr.match(/[1-9]/)) {
                return maybeStr;
            }
        }
        return '';
    }

    function formatRange(date1, date2, formatStr, separator, isRTL) {
        var localeData;
        date1 = FC.moment.parseZone(date1);
        date2 = FC.moment.parseZone(date2);
        localeData = (date1.localeData || date1.lang).call(date1);
        formatStr = localeData.longDateFormat(formatStr) || formatStr;
        separator = separator || ' - ';
        return formatRangeWithChunks(date1, date2, getFormatStringChunks(formatStr), separator, isRTL);
    }

    FC.formatRange = formatRange;

    function formatRangeWithChunks(date1, date2, chunks, separator, isRTL) {
        var unzonedDate1 = date1.clone().stripZone();
        var unzonedDate2 = date2.clone().stripZone();
        var chunkStr;
        var leftI;
        var leftStr = '';
        var rightI;
        var rightStr = '';
        var middleI;
        var middleStr1 = '';
        var middleStr2 = '';
        var middleStr = '';
        for (leftI = 0; leftI < chunks.length; leftI++) {
            chunkStr = formatSimilarChunk(date1, date2, unzonedDate1, unzonedDate2, chunks[leftI]);
            if (chunkStr === false) {
                break;
            }
            leftStr += chunkStr;
        }
        for (rightI = chunks.length - 1; rightI > leftI; rightI--) {
            chunkStr = formatSimilarChunk(date1, date2, unzonedDate1, unzonedDate2, chunks[rightI]);
            if (chunkStr === false) {
                break;
            }
            rightStr = chunkStr + rightStr;
        }
        for (middleI = leftI; middleI <= rightI; middleI++) {
            middleStr1 += formatDateWithChunk(date1, chunks[middleI]);
            middleStr2 += formatDateWithChunk(date2, chunks[middleI]);
        }
        if (middleStr1 || middleStr2) {
            if (isRTL) {
                middleStr = middleStr2 + separator + middleStr1;
            } else {
                middleStr = middleStr1 + separator + middleStr2;
            }
        }
        return leftStr + middleStr + rightStr;
    }

    var similarUnitMap = {
        Y: 'year',
        M: 'month',
        D: 'day',
        d: 'day',
        A: 'second',
        a: 'second',
        T: 'second',
        t: 'second',
        H: 'second',
        h: 'second',
        m: 'second',
        s: 'second'
    };

    function formatSimilarChunk(date1, date2, unzonedDate1, unzonedDate2, chunk) {
        var token;
        var unit;
        if (typeof chunk === 'string') {
            return chunk;
        } else if ((token = chunk.token)) {
            unit = similarUnitMap[token.charAt(0)];
            if (unit && unzonedDate1.isSame(unzonedDate2, unit)) {
                return oldMomentFormat(date1, token);
            }
        }
        return false;
    }

    var formatStringChunkCache = {};

    function getFormatStringChunks(formatStr) {
        if (formatStr in formatStringChunkCache) {
            return formatStringChunkCache[formatStr];
        }
        return (formatStringChunkCache[formatStr] = chunkFormatString(formatStr));
    }

    function chunkFormatString(formatStr) {
        var chunks = [];
        var chunker = /\[([^\]]*)\]|\(([^\)]*)\)|(LTS|LT|(\w)\4*o?)|([^\w\[\(]+)/g;
        var match;
        while ((match = chunker.exec(formatStr))) {
            if (match[1]) {
                chunks.push(match[1]);
            } else if (match[2]) {
                chunks.push({maybe: chunkFormatString(match[2])});
            } else if (match[3]) {
                chunks.push({token: match[3]});
            } else if (match[5]) {
                chunks.push(match[5]);
            }
        }
        return chunks;
    };
    ;FC.Class = Class;

    function Class() {
    }

    Class.extend = function () {
        var len = arguments.length;
        var i;
        var members;
        for (i = 0; i < len; i++) {
            members = arguments[i];
            if (i < len - 1) {
                mixIntoClass(this, members);
            }
        }
        return extendClass(this, members || {});
    };
    Class.mixin = function (members) {
        mixIntoClass(this, members);
    };

    function extendClass(superClass, members) {
        var subClass;
        if (hasOwnProp(members, 'constructor')) {
            subClass = members.constructor;
        }
        if (typeof subClass !== 'function') {
            subClass = members.constructor = function () {
                superClass.apply(this, arguments);
            };
        }
        subClass.prototype = createObject(superClass.prototype);
        copyOwnProps(members, subClass.prototype);
        copyNativeMethods(members, subClass.prototype);
        copyOwnProps(superClass, subClass);
        return subClass;
    }

    function mixIntoClass(theClass, members) {
        copyOwnProps(members, theClass.prototype);
    };
    ;var EmitterMixin = FC.EmitterMixin = {
        on: function (types, handler) {
            var intercept = function (ev, extra) {
                return handler.apply(extra.context || this, extra.args || []);
            };
            if (!handler.guid) {
                handler.guid = $.guid++;
            }
            intercept.guid = handler.guid;
            $(this).on(types, intercept);
            return this;
        }, off: function (types, handler) {
            $(this).off(types, handler);
            return this;
        }, trigger: function (types) {
            var args = Array.prototype.slice.call(arguments, 1);
            $(this).triggerHandler(types, {args: args});
            return this;
        }, triggerWith: function (types, context, args) {
            $(this).triggerHandler(types, {context: context, args: args});
            return this;
        }
    };
    ;
    ;var ListenerMixin = FC.ListenerMixin = (function () {
        var guid = 0;
        var ListenerMixin = {
            listenerId: null, listenTo: function (other, arg, callback) {
                if (typeof arg === 'object') {
                    for (var eventName in arg) {
                        if (arg.hasOwnProperty(eventName)) {
                            this.listenTo(other, eventName, arg[eventName]);
                        }
                    }
                } else if (typeof arg === 'string') {
                    other.on(arg + '.' + this.getListenerNamespace(), $.proxy(callback, this));
                }
            }, stopListeningTo: function (other, eventName) {
                other.off((eventName || '') + '.' + this.getListenerNamespace());
            }, getListenerNamespace: function () {
                if (this.listenerId == null) {
                    this.listenerId = guid++;
                }
                return '_listener' + this.listenerId;
            }
        };
        return ListenerMixin;
    })();
    ;
    ;var MouseIgnorerMixin = {
        isIgnoringMouse: false, delayUnignoreMouse: null, initMouseIgnoring: function (delay) {
            this.delayUnignoreMouse = debounce(proxy(this, 'unignoreMouse'), delay || 1000);
        }, tempIgnoreMouse: function () {
            this.isIgnoringMouse = true;
            this.delayUnignoreMouse();
        }, unignoreMouse: function () {
            this.isIgnoringMouse = false;
        }
    };
    ;
    ;var Popover = Class.extend(ListenerMixin, {
        isHidden: true, options: null, el: null, margin: 10, constructor: function (options) {
            this.options = options || {};
        }, show: function () {
            if (this.isHidden) {
                if (!this.el) {
                    this.render();
                }
                this.el.show();
                this.position();
                this.isHidden = false;
                this.trigger('show');
            }
        }, hide: function () {
            if (!this.isHidden) {
                this.el.hide();
                this.isHidden = true;
                this.trigger('hide');
            }
        }, render: function () {
            var _this = this;
            var options = this.options;
            this.el = $('<div class="fc-popover"/>').addClass(options.className || '').css({
                top: 0,
                left: 0
            }).append(options.content).appendTo(options.parentEl);
            this.el.on('click', '.fc-close', function () {
                _this.hide();
            });
            if (options.autoHide) {
                this.listenTo($(document), 'mousedown', this.documentMousedown);
            }
        }, documentMousedown: function (ev) {
            if (this.el && !$(ev.target).closest(this.el).length) {
                this.hide();
            }
        }, removeElement: function () {
            this.hide();
            if (this.el) {
                this.el.remove();
                this.el = null;
            }
            this.stopListeningTo($(document), 'mousedown');
        }, position: function () {
            var options = this.options;
            var origin = this.el.offsetParent().offset();
            var width = this.el.outerWidth();
            var height = this.el.outerHeight();
            var windowEl = $(window);
            var viewportEl = getScrollParent(this.el);
            var viewportTop;
            var viewportLeft;
            var viewportOffset;
            var top;
            var left;
            top = options.top || 0;
            if (options.left !== undefined) {
                left = options.left;
            } else if (options.right !== undefined) {
                left = options.right - width;
            } else {
                left = 0;
            }
            if (viewportEl.is(window) || viewportEl.is(document)) {
                viewportEl = windowEl;
                viewportTop = 0;
                viewportLeft = 0;
            } else {
                viewportOffset = viewportEl.offset();
                viewportTop = viewportOffset.top;
                viewportLeft = viewportOffset.left;
            }
            viewportTop += windowEl.scrollTop();
            viewportLeft += windowEl.scrollLeft();
            if (options.viewportConstrain !== false) {
                top = Math.min(top, viewportTop + viewportEl.outerHeight() - height - this.margin);
                top = Math.max(top, viewportTop + this.margin);
                left = Math.min(left, viewportLeft + viewportEl.outerWidth() - width - this.margin);
                left = Math.max(left, viewportLeft + this.margin);
            }
            this.el.css({top: top - origin.top, left: left - origin.left});
        }, trigger: function (name) {
            if (this.options[name]) {
                this.options[name].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    });
    ;
    ;var CoordCache = FC.CoordCache = Class.extend({
        els: null,
        forcedOffsetParentEl: null,
        origin: null,
        boundingRect: null,
        isHorizontal: false,
        isVertical: false,
        lefts: null,
        rights: null,
        tops: null,
        bottoms: null,
        constructor: function (options) {
            this.els = $(options.els);
            this.isHorizontal = options.isHorizontal;
            this.isVertical = options.isVertical;
            this.forcedOffsetParentEl = options.offsetParent ? $(options.offsetParent) : null;
        },
        build: function () {
            var offsetParentEl = this.forcedOffsetParentEl || this.els.eq(0).offsetParent();
            this.origin = offsetParentEl.offset();
            this.boundingRect = this.queryBoundingRect();
            if (this.isHorizontal) {
                this.buildElHorizontals();
            }
            if (this.isVertical) {
                this.buildElVerticals();
            }
        },
        clear: function () {
            this.origin = null;
            this.boundingRect = null;
            this.lefts = null;
            this.rights = null;
            this.tops = null;
            this.bottoms = null;
        },
        ensureBuilt: function () {
            if (!this.origin) {
                this.build();
            }
        },
        queryBoundingRect: function () {
            var scrollParentEl = getScrollParent(this.els.eq(0));
            if (!scrollParentEl.is(document)) {
                return getClientRect(scrollParentEl);
            }
        },
        buildElHorizontals: function () {
            var lefts = [];
            var rights = [];
            this.els.each(function (i, node) {
                var el = $(node);
                var left = el.offset().left;
                var width = el.outerWidth();
                lefts.push(left);
                rights.push(left + width);
            });
            this.lefts = lefts;
            this.rights = rights;
        },
        buildElVerticals: function () {
            var tops = [];
            var bottoms = [];
            this.els.each(function (i, node) {
                var el = $(node);
                var top = el.offset().top;
                var height = el.outerHeight();
                tops.push(top);
                bottoms.push(top + height);
            });
            this.tops = tops;
            this.bottoms = bottoms;
        },
        getHorizontalIndex: function (leftOffset) {
            this.ensureBuilt();
            var boundingRect = this.boundingRect;
            var lefts = this.lefts;
            var rights = this.rights;
            var len = lefts.length;
            var i;
            if (!boundingRect || (leftOffset >= boundingRect.left && leftOffset < boundingRect.right)) {
                for (i = 0; i < len; i++) {
                    if (leftOffset >= lefts[i] && leftOffset < rights[i]) {
                        return i;
                    }
                }
            }
        },
        getVerticalIndex: function (topOffset) {
            this.ensureBuilt();
            var boundingRect = this.boundingRect;
            var tops = this.tops;
            var bottoms = this.bottoms;
            var len = tops.length;
            var i;
            if (!boundingRect || (topOffset >= boundingRect.top && topOffset < boundingRect.bottom)) {
                for (i = 0; i < len; i++) {
                    if (topOffset >= tops[i] && topOffset < bottoms[i]) {
                        return i;
                    }
                }
            }
        },
        getLeftOffset: function (leftIndex) {
            this.ensureBuilt();
            return this.lefts[leftIndex];
        },
        getLeftPosition: function (leftIndex) {
            this.ensureBuilt();
            return this.lefts[leftIndex] - this.origin.left;
        },
        getRightOffset: function (leftIndex) {
            this.ensureBuilt();
            return this.rights[leftIndex];
        },
        getRightPosition: function (leftIndex) {
            this.ensureBuilt();
            return this.rights[leftIndex] - this.origin.left;
        },
        getWidth: function (leftIndex) {
            this.ensureBuilt();
            return this.rights[leftIndex] - this.lefts[leftIndex];
        },
        getTopOffset: function (topIndex) {
            this.ensureBuilt();
            return this.tops[topIndex];
        },
        getTopPosition: function (topIndex) {
            this.ensureBuilt();
            return this.tops[topIndex] - this.origin.top;
        },
        getBottomOffset: function (topIndex) {
            this.ensureBuilt();
            return this.bottoms[topIndex];
        },
        getBottomPosition: function (topIndex) {
            this.ensureBuilt();
            return this.bottoms[topIndex] - this.origin.top;
        },
        getHeight: function (topIndex) {
            this.ensureBuilt();
            return this.bottoms[topIndex] - this.tops[topIndex];
        }
    });
    ;
    ;var DragListener = FC.DragListener = Class.extend(ListenerMixin, MouseIgnorerMixin, {
        options: null,
        subjectEl: null,
        subjectHref: null,
        originX: null,
        originY: null,
        scrollEl: null,
        isInteracting: false,
        isDistanceSurpassed: false,
        isDelayEnded: false,
        isDragging: false,
        isTouch: false,
        delay: null,
        delayTimeoutId: null,
        minDistance: null,
        handleTouchScrollProxy: null,
        constructor: function (options) {
            this.options = options || {};
            this.handleTouchScrollProxy = proxy(this, 'handleTouchScroll');
            this.initMouseIgnoring(500);
        },
        startInteraction: function (ev, extraOptions) {
            var isTouch = getEvIsTouch(ev);
            if (ev.type === 'mousedown') {
                if (this.isIgnoringMouse) {
                    return;
                } else if (!isPrimaryMouseButton(ev)) {
                    return;
                } else {
                    ev.preventDefault();
                }
            }
            if (!this.isInteracting) {
                extraOptions = extraOptions || {};
                this.delay = firstDefined(extraOptions.delay, this.options.delay, 0);
                this.minDistance = firstDefined(extraOptions.distance, this.options.distance, 0);
                this.subjectEl = this.options.subjectEl;
                this.isInteracting = true;
                this.isTouch = isTouch;
                this.isDelayEnded = false;
                this.isDistanceSurpassed = false;
                this.originX = getEvX(ev);
                this.originY = getEvY(ev);
                this.scrollEl = getScrollParent($(ev.target));
                this.bindHandlers();
                this.initAutoScroll();
                this.handleInteractionStart(ev);
                this.startDelay(ev);
                if (!this.minDistance) {
                    this.handleDistanceSurpassed(ev);
                }
            }
        },
        handleInteractionStart: function (ev) {
            this.trigger('interactionStart', ev);
        },
        endInteraction: function (ev, isCancelled) {
            if (this.isInteracting) {
                this.endDrag(ev);
                if (this.delayTimeoutId) {
                    clearTimeout(this.delayTimeoutId);
                    this.delayTimeoutId = null;
                }
                this.destroyAutoScroll();
                this.unbindHandlers();
                this.isInteracting = false;
                this.handleInteractionEnd(ev, isCancelled);
                if (this.isTouch) {
                    this.tempIgnoreMouse();
                }
            }
        },
        handleInteractionEnd: function (ev, isCancelled) {
            this.trigger('interactionEnd', ev, isCancelled || false);
        },
        bindHandlers: function () {
            var _this = this;
            var touchStartIgnores = 1;
            if (this.isTouch) {
                this.listenTo($(document), {
                    touchmove: this.handleTouchMove,
                    touchend: this.endInteraction,
                    touchcancel: this.endInteraction,
                    touchstart: function (ev) {
                        if (touchStartIgnores) {
                            touchStartIgnores--;
                        } else {
                            _this.endInteraction(ev, true);
                        }
                    }
                });
                if (!bindAnyScroll(this.handleTouchScrollProxy) && this.scrollEl) {
                    this.listenTo(this.scrollEl, 'scroll', this.handleTouchScroll);
                }
            } else {
                this.listenTo($(document), {mousemove: this.handleMouseMove, mouseup: this.endInteraction});
            }
            this.listenTo($(document), {selectstart: preventDefault, contextmenu: preventDefault});
        },
        unbindHandlers: function () {
            this.stopListeningTo($(document));
            unbindAnyScroll(this.handleTouchScrollProxy);
            if (this.scrollEl) {
                this.stopListeningTo(this.scrollEl, 'scroll');
            }
        },
        startDrag: function (ev, extraOptions) {
            this.startInteraction(ev, extraOptions);
            if (!this.isDragging) {
                this.isDragging = true;
                this.handleDragStart(ev);
            }
        },
        handleDragStart: function (ev) {
            this.trigger('dragStart', ev);
            this.initHrefHack();
        },
        handleMove: function (ev) {
            var dx = getEvX(ev) - this.originX;
            var dy = getEvY(ev) - this.originY;
            var minDistance = this.minDistance;
            var distanceSq;
            if (!this.isDistanceSurpassed) {
                distanceSq = dx * dx + dy * dy;
                if (distanceSq >= minDistance * minDistance) {
                    this.handleDistanceSurpassed(ev);
                }
            }
            if (this.isDragging) {
                this.handleDrag(dx, dy, ev);
            }
        },
        handleDrag: function (dx, dy, ev) {
            this.trigger('drag', dx, dy, ev);
            this.updateAutoScroll(ev);
        },
        endDrag: function (ev) {
            if (this.isDragging) {
                this.isDragging = false;
                this.handleDragEnd(ev);
            }
        },
        handleDragEnd: function (ev) {
            this.trigger('dragEnd', ev);
            this.destroyHrefHack();
        },
        startDelay: function (initialEv) {
            var _this = this;
            if (this.delay) {
                this.delayTimeoutId = setTimeout(function () {
                    _this.handleDelayEnd(initialEv);
                }, this.delay);
            } else {
                this.handleDelayEnd(initialEv);
            }
        },
        handleDelayEnd: function (initialEv) {
            this.isDelayEnded = true;
            if (this.isDistanceSurpassed) {
                this.startDrag(initialEv);
            }
        },
        handleDistanceSurpassed: function (ev) {
            this.isDistanceSurpassed = true;
            if (this.isDelayEnded) {
                this.startDrag(ev);
            }
        },
        handleTouchMove: function (ev) {
            if (this.isDragging) {
                ev.preventDefault();
            }
            this.handleMove(ev);
        },
        handleMouseMove: function (ev) {
            this.handleMove(ev);
        },
        handleTouchScroll: function (ev) {
            if (!this.isDragging) {
                this.endInteraction(ev, true);
            }
        },
        initHrefHack: function () {
            var subjectEl = this.subjectEl;
            if ((this.subjectHref = subjectEl ? subjectEl.attr('href') : null)) {
                subjectEl.removeAttr('href');
            }
        },
        destroyHrefHack: function () {
            var subjectEl = this.subjectEl;
            var subjectHref = this.subjectHref;
            setTimeout(function () {
                if (subjectHref) {
                    subjectEl.attr('href', subjectHref);
                }
            }, 0);
        },
        trigger: function (name) {
            if (this.options[name]) {
                this.options[name].apply(this, Array.prototype.slice.call(arguments, 1));
            }
            if (this['_' + name]) {
                this['_' + name].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    });
    ;
    ;DragListener.mixin({
        isAutoScroll: false,
        scrollBounds: null,
        scrollTopVel: null,
        scrollLeftVel: null,
        scrollIntervalId: null,
        scrollSensitivity: 30,
        scrollSpeed: 200,
        scrollIntervalMs: 50,
        initAutoScroll: function () {
            var scrollEl = this.scrollEl;
            this.isAutoScroll = this.options.scroll && scrollEl && !scrollEl.is(window) && !scrollEl.is(document);
            if (this.isAutoScroll) {
                this.listenTo(scrollEl, 'scroll', debounce(this.handleDebouncedScroll, 100));
            }
        },
        destroyAutoScroll: function () {
            this.endAutoScroll();
            if (this.isAutoScroll) {
                this.stopListeningTo(this.scrollEl, 'scroll');
            }
        },
        computeScrollBounds: function () {
            if (this.isAutoScroll) {
                this.scrollBounds = getOuterRect(this.scrollEl);
            }
        },
        updateAutoScroll: function (ev) {
            var sensitivity = this.scrollSensitivity;
            var bounds = this.scrollBounds;
            var topCloseness, bottomCloseness;
            var leftCloseness, rightCloseness;
            var topVel = 0;
            var leftVel = 0;
            if (bounds) {
                topCloseness = (sensitivity - (getEvY(ev) - bounds.top)) / sensitivity;
                bottomCloseness = (sensitivity - (bounds.bottom - getEvY(ev))) / sensitivity;
                leftCloseness = (sensitivity - (getEvX(ev) - bounds.left)) / sensitivity;
                rightCloseness = (sensitivity - (bounds.right - getEvX(ev))) / sensitivity;
                if (topCloseness >= 0 && topCloseness <= 1) {
                    topVel = topCloseness * this.scrollSpeed * -1;
                } else if (bottomCloseness >= 0 && bottomCloseness <= 1) {
                    topVel = bottomCloseness * this.scrollSpeed;
                }
                if (leftCloseness >= 0 && leftCloseness <= 1) {
                    leftVel = leftCloseness * this.scrollSpeed * -1;
                } else if (rightCloseness >= 0 && rightCloseness <= 1) {
                    leftVel = rightCloseness * this.scrollSpeed;
                }
            }
            this.setScrollVel(topVel, leftVel);
        },
        setScrollVel: function (topVel, leftVel) {
            this.scrollTopVel = topVel;
            this.scrollLeftVel = leftVel;
            this.constrainScrollVel();
            if ((this.scrollTopVel || this.scrollLeftVel) && !this.scrollIntervalId) {
                this.scrollIntervalId = setInterval(proxy(this, 'scrollIntervalFunc'), this.scrollIntervalMs);
            }
        },
        constrainScrollVel: function () {
            var el = this.scrollEl;
            if (this.scrollTopVel < 0) {
                if (el.scrollTop() <= 0) {
                    this.scrollTopVel = 0;
                }
            } else if (this.scrollTopVel > 0) {
                if (el.scrollTop() + el[0].clientHeight >= el[0].scrollHeight) {
                    this.scrollTopVel = 0;
                }
            }
            if (this.scrollLeftVel < 0) {
                if (el.scrollLeft() <= 0) {
                    this.scrollLeftVel = 0;
                }
            } else if (this.scrollLeftVel > 0) {
                if (el.scrollLeft() + el[0].clientWidth >= el[0].scrollWidth) {
                    this.scrollLeftVel = 0;
                }
            }
        },
        scrollIntervalFunc: function () {
            var el = this.scrollEl;
            var frac = this.scrollIntervalMs / 1000;
            if (this.scrollTopVel) {
                el.scrollTop(el.scrollTop() + this.scrollTopVel * frac);
            }
            if (this.scrollLeftVel) {
                el.scrollLeft(el.scrollLeft() + this.scrollLeftVel * frac);
            }
            this.constrainScrollVel();
            if (!this.scrollTopVel && !this.scrollLeftVel) {
                this.endAutoScroll();
            }
        },
        endAutoScroll: function () {
            if (this.scrollIntervalId) {
                clearInterval(this.scrollIntervalId);
                this.scrollIntervalId = null;
                this.handleScrollEnd();
            }
        },
        handleDebouncedScroll: function () {
            if (!this.scrollIntervalId) {
                this.handleScrollEnd();
            }
        },
        handleScrollEnd: function () {
        }
    });
    ;
    ;var HitDragListener = DragListener.extend({
        component: null, origHit: null, hit: null, coordAdjust: null, constructor: function (component, options) {
            DragListener.call(this, options);
            this.component = component;
        }, handleInteractionStart: function (ev) {
            var subjectEl = this.subjectEl;
            var subjectRect;
            var origPoint;
            var point;
            this.computeCoords();
            if (ev) {
                origPoint = {left: getEvX(ev), top: getEvY(ev)};
                point = origPoint;
                if (subjectEl) {
                    subjectRect = getOuterRect(subjectEl);
                    point = constrainPoint(point, subjectRect);
                }
                this.origHit = this.queryHit(point.left, point.top);
                if (subjectEl && this.options.subjectCenter) {
                    if (this.origHit) {
                        subjectRect = intersectRects(this.origHit, subjectRect) || subjectRect;
                    }
                    point = getRectCenter(subjectRect);
                }
                this.coordAdjust = diffPoints(point, origPoint);
            } else {
                this.origHit = null;
                this.coordAdjust = null;
            }
            DragListener.prototype.handleInteractionStart.apply(this, arguments);
        }, computeCoords: function () {
            this.component.prepareHits();
            this.computeScrollBounds();
        }, handleDragStart: function (ev) {
            var hit;
            DragListener.prototype.handleDragStart.apply(this, arguments);
            hit = this.queryHit(getEvX(ev), getEvY(ev));
            if (hit) {
                this.handleHitOver(hit);
            }
        }, handleDrag: function (dx, dy, ev) {
            var hit;
            DragListener.prototype.handleDrag.apply(this, arguments);
            hit = this.queryHit(getEvX(ev), getEvY(ev));
            if (!isHitsEqual(hit, this.hit)) {
                if (this.hit) {
                    this.handleHitOut();
                }
                if (hit) {
                    this.handleHitOver(hit);
                }
            }
        }, handleDragEnd: function () {
            this.handleHitDone();
            DragListener.prototype.handleDragEnd.apply(this, arguments);
        }, handleHitOver: function (hit) {
            var isOrig = isHitsEqual(hit, this.origHit);
            this.hit = hit;
            this.trigger('hitOver', this.hit, isOrig, this.origHit);
        }, handleHitOut: function () {
            if (this.hit) {
                this.trigger('hitOut', this.hit);
                this.handleHitDone();
                this.hit = null;
            }
        }, handleHitDone: function () {
            if (this.hit) {
                this.trigger('hitDone', this.hit);
            }
        }, handleInteractionEnd: function () {
            DragListener.prototype.handleInteractionEnd.apply(this, arguments);
            this.origHit = null;
            this.hit = null;
            this.component.releaseHits();
        }, handleScrollEnd: function () {
            DragListener.prototype.handleScrollEnd.apply(this, arguments);
            this.computeCoords();
        }, queryHit: function (left, top) {
            if (this.coordAdjust) {
                left += this.coordAdjust.left;
                top += this.coordAdjust.top;
            }
            return this.component.queryHit(left, top);
        }
    });

    function isHitsEqual(hit0, hit1) {
        if (!hit0 && !hit1) {
            return true;
        }
        if (hit0 && hit1) {
            return hit0.component === hit1.component && isHitPropsWithin(hit0, hit1) && isHitPropsWithin(hit1, hit0);
        }
        return false;
    }

    function isHitPropsWithin(subHit, superHit) {
        for (var propName in subHit) {
            if (!/^(component|left|right|top|bottom)$/.test(propName)) {
                if (subHit[propName] !== superHit[propName]) {
                    return false;
                }
            }
        }
        return true;
    };
    ;var MouseFollower = Class.extend(ListenerMixin, {
        options: null,
        sourceEl: null,
        el: null,
        parentEl: null,
        top0: null,
        left0: null,
        y0: null,
        x0: null,
        topDelta: null,
        leftDelta: null,
        isFollowing: false,
        isHidden: false,
        isAnimating: false,
        constructor: function (sourceEl, options) {
            this.options = options = options || {};
            this.sourceEl = sourceEl;
            this.parentEl = options.parentEl ? $(options.parentEl) : sourceEl.parent();
        },
        start: function (ev) {
            if (!this.isFollowing) {
                this.isFollowing = true;
                this.y0 = getEvY(ev);
                this.x0 = getEvX(ev);
                this.topDelta = 0;
                this.leftDelta = 0;
                if (!this.isHidden) {
                    this.updatePosition();
                }
                if (getEvIsTouch(ev)) {
                    this.listenTo($(document), 'touchmove', this.handleMove);
                } else {
                    this.listenTo($(document), 'mousemove', this.handleMove);
                }
            }
        },
        stop: function (shouldRevert, callback) {
            var _this = this;
            var revertDuration = this.options.revertDuration;

            function complete() {
                this.isAnimating = false;
                _this.removeElement();
                this.top0 = this.left0 = null;
                if (callback) {
                    callback();
                }
            }

            if (this.isFollowing && !this.isAnimating) {
                this.isFollowing = false;
                this.stopListeningTo($(document));
                if (shouldRevert && revertDuration && !this.isHidden) {
                    this.isAnimating = true;
                    this.el.animate({top: this.top0, left: this.left0}, {duration: revertDuration, complete: complete});
                } else {
                    complete();
                }
            }
        },
        getEl: function () {
            var el = this.el;
            if (!el) {
                this.sourceEl.width();
                el = this.el = this.sourceEl.clone().addClass(this.options.additionalClass || '').css({
                    position: 'absolute',
                    visibility: '',
                    display: this.isHidden ? 'none' : '',
                    margin: 0,
                    right: 'auto',
                    bottom: 'auto',
                    width: this.sourceEl.width(),
                    height: this.sourceEl.height(),
                    opacity: this.options.opacity || '',
                    zIndex: this.options.zIndex
                });
                el.addClass('fc-unselectable');
                el.appendTo(this.parentEl);
            }
            return el;
        },
        removeElement: function () {
            if (this.el) {
                this.el.remove();
                this.el = null;
            }
        },
        updatePosition: function () {
            var sourceOffset;
            var origin;
            this.getEl();
            if (this.top0 === null) {
                this.sourceEl.width();
                sourceOffset = this.sourceEl.offset();
                origin = this.el.offsetParent().offset();
                this.top0 = sourceOffset.top - origin.top;
                this.left0 = sourceOffset.left - origin.left;
            }
            this.el.css({top: this.top0 + this.topDelta, left: this.left0 + this.leftDelta});
        },
        handleMove: function (ev) {
            this.topDelta = getEvY(ev) - this.y0;
            this.leftDelta = getEvX(ev) - this.x0;
            if (!this.isHidden) {
                this.updatePosition();
            }
        },
        hide: function () {
            if (!this.isHidden) {
                this.isHidden = true;
                if (this.el) {
                    this.el.hide();
                }
            }
        },
        show: function () {
            if (this.isHidden) {
                this.isHidden = false;
                this.updatePosition();
                this.getEl().show();
            }
        }
    });
    ;
    ;var Grid = FC.Grid = Class.extend(ListenerMixin, MouseIgnorerMixin, {
        view: null,
        isRTL: null,
        start: null,
        end: null,
        el: null,
        elsByFill: null,
        eventTimeFormat: null,
        displayEventTime: null,
        displayEventEnd: null,
        minResizeDuration: null,
        largeUnit: null,
        dayDragListener: null,
        segDragListener: null,
        segResizeListener: null,
        externalDragListener: null,
        constructor: function (view) {
            this.view = view;
            this.isRTL = view.opt('isRTL');
            this.elsByFill = {};
            this.dayDragListener = this.buildDayDragListener();
            this.initMouseIgnoring();
        },
        computeEventTimeFormat: function () {
            return this.view.opt('smallTimeFormat');
        },
        computeDisplayEventTime: function () {
            return true;
        },
        computeDisplayEventEnd: function () {
            return true;
        },
        setRange: function (range) {
            this.start = range.start.clone();
            this.end = range.end.clone();
            this.rangeUpdated();
            this.processRangeOptions();
        },
        rangeUpdated: function () {
        },
        processRangeOptions: function () {
            var view = this.view;
            var displayEventTime;
            var displayEventEnd;
            this.eventTimeFormat = view.opt('eventTimeFormat') || view.opt('timeFormat') || this.computeEventTimeFormat();
            displayEventTime = view.opt('displayEventTime');
            if (displayEventTime == null) {
                displayEventTime = this.computeDisplayEventTime();
            }
            displayEventEnd = view.opt('displayEventEnd');
            if (displayEventEnd == null) {
                displayEventEnd = this.computeDisplayEventEnd();
            }
            this.displayEventTime = displayEventTime;
            this.displayEventEnd = displayEventEnd;
        },
        spanToSegs: function (span) {
        },
        diffDates: function (a, b) {
            if (this.largeUnit) {
                return diffByUnit(a, b, this.largeUnit);
            } else {
                return diffDayTime(a, b);
            }
        },
        prepareHits: function () {
        },
        releaseHits: function () {
        },
        queryHit: function (leftOffset, topOffset) {
        },
        getHitSpan: function (hit) {
        },
        getHitEl: function (hit) {
        },
        setElement: function (el) {
            this.el = el;
            preventSelection(el);
            this.bindDayHandler('touchstart', this.dayTouchStart);
            this.bindDayHandler('mousedown', this.dayMousedown);
            this.bindSegHandlers();
            this.bindGlobalHandlers();
        },
        bindDayHandler: function (name, handler) {
            var _this = this;
            this.el.on(name, function (ev) {
                if (!$(ev.target).is('.fc-event-container *, .fc-more') && !$(ev.target).closest('.fc-popover').length) {
                    return handler.call(_this, ev);
                }
            });
        },
        removeElement: function () {
            this.unbindGlobalHandlers();
            this.clearDragListeners();
            this.el.remove();
        },
        renderSkeleton: function () {
        },
        renderDates: function () {
        },
        unrenderDates: function () {
        },
        bindGlobalHandlers: function () {
            this.listenTo($(document), {dragstart: this.externalDragStart, sortstart: this.externalDragStart});
        },
        unbindGlobalHandlers: function () {
            this.stopListeningTo($(document));
        },
        dayMousedown: function (ev) {
            if (!this.isIgnoringMouse) {
                this.dayDragListener.startInteraction(ev, {});
            }
        },
        dayTouchStart: function (ev) {
            var view = this.view;
            if (view.isSelected || view.selectedEvent) {
                this.tempIgnoreMouse();
            }
            this.dayDragListener.startInteraction(ev, {delay: this.view.opt('longPressDelay')});
        },
        buildDayDragListener: function () {
            var _this = this;
            var view = this.view;
            var isSelectable = view.opt('selectable');
            var dayClickHit;
            var selectionSpan;
            var dragListener = new HitDragListener(this, {
                scroll: view.opt('dragScroll'), interactionStart: function () {
                    dayClickHit = dragListener.origHit;
                }, dragStart: function () {
                    view.unselect();
                }, hitOver: function (hit, isOrig, origHit) {
                    if (origHit) {
                        if (!isOrig) {
                            dayClickHit = null;
                        }
                        if (isSelectable) {
                            selectionSpan = _this.computeSelection(_this.getHitSpan(origHit), _this.getHitSpan(hit));
                            if (selectionSpan) {
                                _this.renderSelection(selectionSpan);
                            } else if (selectionSpan === false) {
                                disableCursor();
                            }
                        }
                    }
                }, hitOut: function () {
                    dayClickHit = null;
                    selectionSpan = null;
                    _this.unrenderSelection();
                    enableCursor();
                }, interactionEnd: function (ev, isCancelled) {
                    if (!isCancelled) {
                        if (dayClickHit && !_this.isIgnoringMouse) {
                            view.triggerDayClick(_this.getHitSpan(dayClickHit), _this.getHitEl(dayClickHit), ev);
                        }
                        if (selectionSpan) {
                            view.reportSelection(selectionSpan, ev);
                        }
                        enableCursor();
                    }
                }
            });
            return dragListener;
        },
        clearDragListeners: function () {
            this.dayDragListener.endInteraction();
            if (this.segDragListener) {
                this.segDragListener.endInteraction();
            }
            if (this.segResizeListener) {
                this.segResizeListener.endInteraction();
            }
            if (this.externalDragListener) {
                this.externalDragListener.endInteraction();
            }
        },
        renderEventLocationHelper: function (eventLocation, sourceSeg) {
            var fakeEvent = this.fabricateHelperEvent(eventLocation, sourceSeg);
            return this.renderHelper(fakeEvent, sourceSeg);
        },
        fabricateHelperEvent: function (eventLocation, sourceSeg) {
            var fakeEvent = sourceSeg ? createObject(sourceSeg.event) : {};
            fakeEvent.start = eventLocation.start.clone();
            fakeEvent.end = eventLocation.end ? eventLocation.end.clone() : null;
            fakeEvent.allDay = null;
            this.view.calendar.normalizeEventDates(fakeEvent);
            fakeEvent.className = (fakeEvent.className || []).concat('fc-helper');
            if (!sourceSeg) {
                fakeEvent.editable = false;
            }
            return fakeEvent;
        },
        renderHelper: function (eventLocation, sourceSeg) {
        },
        unrenderHelper: function () {
        },
        renderSelection: function (span) {
            this.renderHighlight(span);
        },
        unrenderSelection: function () {
            this.unrenderHighlight();
        },
        computeSelection: function (span0, span1) {
            var span = this.computeSelectionSpan(span0, span1);
            if (span && !this.view.calendar.isSelectionSpanAllowed(span)) {
                return false;
            }
            return span;
        },
        computeSelectionSpan: function (span0, span1) {
            var dates = [span0.start, span0.end, span1.start, span1.end];
            dates.sort(compareNumbers);
            return {start: dates[0].clone(), end: dates[3].clone()};
        },
        renderHighlight: function (span) {
            this.renderFill('highlight', this.spanToSegs(span));
        },
        unrenderHighlight: function () {
            this.unrenderFill('highlight');
        },
        highlightSegClasses: function () {
            return ['fc-highlight'];
        },
        renderBusinessHours: function () {
        },
        unrenderBusinessHours: function () {
        },
        getNowIndicatorUnit: function () {
        },
        renderNowIndicator: function (date) {
        },
        unrenderNowIndicator: function () {
        },
        renderFill: function (type, segs) {
        },
        unrenderFill: function (type) {
            var el = this.elsByFill[type];
            if (el) {
                el.remove();
                delete this.elsByFill[type];
            }
        },
        renderFillSegEls: function (type, segs) {
            var _this = this;
            var segElMethod = this[type + 'SegEl'];
            var html = '';
            var renderedSegs = [];
            var i;
            if (segs.length) {
                for (i = 0; i < segs.length; i++) {
                    html += this.fillSegHtml(type, segs[i]);
                }
                $(html).each(function (i, node) {
                    var seg = segs[i];
                    var el = $(node);
                    if (segElMethod) {
                        el = segElMethod.call(_this, seg, el);
                    }
                    if (el) {
                        el = $(el);
                        if (el.is(_this.fillSegTag)) {
                            seg.el = el;
                            renderedSegs.push(seg);
                        }
                    }
                });
            }
            return renderedSegs;
        },
        fillSegTag: 'div',
        fillSegHtml: function (type, seg) {
            var classesMethod = this[type + 'SegClasses'];
            var cssMethod = this[type + 'SegCss'];
            var classes = classesMethod ? classesMethod.call(this, seg) : [];
            var css = cssToStr(cssMethod ? cssMethod.call(this, seg) : {});
            return '<' + this.fillSegTag +
                (classes.length ? ' class="' + classes.join(' ') + '"' : '') +
                (css ? ' style="' + css + '"' : '') +
                ' />';
        },
        getDayClasses: function (date) {
            var view = this.view;
            var today = view.calendar.getNow();
            var classes = ['fc-' + dayIDs[date.day()]];
            if (view.intervalDuration.as('months') == 1 && date.month() != view.intervalStart.month()) {
                classes.push('fc-other-month');
            }
            if (date.isSame(today, 'day')) {
                classes.push('fc-today', view.highlightStateClass);
            } else if (date < today) {
                classes.push('fc-past');
            } else {
                classes.push('fc-future');
            }
            if (this.view.options.holidays) {
                var ttt = date.year() + '-' + (date.month() + 1) + '-' + date.date();
                if (this.view.options.holidays.indexOf(ttt) >= 0) {
                    classes.push('fc-holiday');
                }
            }
            return classes;
        }
    });
    ;
    ;Grid.mixin({
        mousedOverSeg: null,
        isDraggingSeg: false,
        isResizingSeg: false,
        isDraggingExternal: false,
        segs: null,
        renderEvents: function (events) {
            var bgEvents = [];
            var fgEvents = [];
            var i;
            for (i = 0; i < events.length; i++) {
                (isBgEvent(events[i]) ? bgEvents : fgEvents).push(events[i]);
            }
            this.segs = [].concat(this.renderBgEvents(bgEvents), this.renderFgEvents(fgEvents));
        },
        renderBgEvents: function (events) {
            var segs = this.eventsToSegs(events);
            return this.renderBgSegs(segs) || segs;
        },
        renderFgEvents: function (events) {
            var segs = this.eventsToSegs(events);
            return this.renderFgSegs(segs) || segs;
        },
        unrenderEvents: function () {
            this.handleSegMouseout();
            this.clearDragListeners();
            this.unrenderFgSegs();
            this.unrenderBgSegs();
            this.segs = null;
        },
        getEventSegs: function () {
            return this.segs || [];
        },
        renderFgSegs: function (segs) {
        },
        unrenderFgSegs: function () {
        },
        renderFgSegEls: function (segs, disableResizing) {
            var view = this.view;
            var html = '';
            var renderedSegs = [];
            var i;
            if (segs.length) {
                for (i = 0; i < segs.length; i++) {
                    html += this.fgSegHtml(segs[i], disableResizing);
                }
                $(html).each(function (i, node) {
                    var seg = segs[i];
                    var el = view.resolveEventEl(seg.event, $(node));
                    if (el) {
                        el.data('fc-seg', seg);
                        seg.el = el;
                        renderedSegs.push(seg);
                    }
                });
            }
            return renderedSegs;
        },
        fgSegHtml: function (seg, disableResizing) {
        },
        renderBgSegs: function (segs) {
            return this.renderFill('bgEvent', segs);
        },
        unrenderBgSegs: function () {
            this.unrenderFill('bgEvent');
        },
        bgEventSegEl: function (seg, el) {
            return this.view.resolveEventEl(seg.event, el);
        },
        bgEventSegClasses: function (seg) {
            var event = seg.event;
            var source = event.source || {};
            return ['fc-bgevent'].concat(event.className, source.className || []);
        },
        bgEventSegCss: function (seg) {
            return {'background-color': this.getSegSkinCss(seg)['background-color']};
        },
        businessHoursSegClasses: function (seg) {
            return ['fc-nonbusiness', 'fc-bgevent'];
        },
        bindSegHandlers: function () {
            this.bindSegHandler('touchstart', this.handleSegTouchStart);
            this.bindSegHandler('touchend', this.handleSegTouchEnd);
            this.bindSegHandler('mouseenter', this.handleSegMouseover);
            this.bindSegHandler('mouseleave', this.handleSegMouseout);
            this.bindSegHandler('mousedown', this.handleSegMousedown);
            this.bindSegHandler('click', this.handleSegClick);
        },
        bindSegHandler: function (name, handler) {
            var _this = this;
            this.el.on(name, '.fc-event-container > *', function (ev) {
                var seg = $(this).data('fc-seg');
                if (seg && !_this.isDraggingSeg && !_this.isResizingSeg) {
                    return handler.call(_this, seg, ev);
                }
            });
        },
        handleSegClick: function (seg, ev) {
            return this.view.trigger('eventClick', seg.el[0], seg.event, ev);
        },
        handleSegMouseover: function (seg, ev) {
            if (!this.isIgnoringMouse && !this.mousedOverSeg) {
                this.mousedOverSeg = seg;
                seg.el.addClass('fc-allow-mouse-resize');
                seg.el.parent().addClass('fc-event-container-hover');
                this.view.trigger('eventMouseover', seg.el[0], seg.event, ev);
            }
        },
        handleSegMouseout: function (seg, ev) {
            ev = ev || {};
            if (this.mousedOverSeg) {
                seg = seg || this.mousedOverSeg;
                this.mousedOverSeg = null;
                seg.el.removeClass('fc-allow-mouse-resize');
                seg.el.parent().removeClass('fc-event-container-hover');
                this.view.trigger('eventMouseout', seg.el[0], seg.event, ev);
            }
        },
        handleSegMousedown: function (seg, ev) {
            var isResizing = this.startSegResize(seg, ev, {distance: 5});
            if (!isResizing && this.view.isEventDraggable(seg.event)) {
                this.buildSegDragListener(seg).startInteraction(ev, {distance: 5});
            }
        },
        handleSegTouchStart: function (seg, ev) {
            var view = this.view;
            var event = seg.event;
            var isSelected = view.isEventSelected(event);
            var isDraggable = view.isEventDraggable(event);
            var isResizable = view.isEventResizable(event);
            var isResizing = false;
            var dragListener;
            if (isSelected && isResizable) {
                isResizing = this.startSegResize(seg, ev);
            }
            if (!isResizing && (isDraggable || isResizable)) {
                dragListener = isDraggable ? this.buildSegDragListener(seg) : this.buildSegSelectListener(seg);
                dragListener.startInteraction(ev, {delay: isSelected ? 0 : this.view.opt('longPressDelay')});
            }
            this.tempIgnoreMouse();
        },
        handleSegTouchEnd: function (seg, ev) {
            this.tempIgnoreMouse();
        },
        startSegResize: function (seg, ev, dragOptions) {
            if ($(ev.target).is('.fc-resizer')) {
                this.buildSegResizeListener(seg, $(ev.target).is('.fc-start-resizer')).startInteraction(ev, dragOptions);
                return true;
            }
            return false;
        },
        buildSegDragListener: function (seg) {
            var _this = this;
            var view = this.view;
            var calendar = view.calendar;
            var el = seg.el;
            var event = seg.event;
            var isDragging;
            var mouseFollower;
            var dropLocation;
            if (this.segDragListener) {
                return this.segDragListener;
            }
            var dragListener = this.segDragListener = new HitDragListener(view, {
                scroll: view.opt('dragScroll'), subjectEl: el, subjectCenter: true, interactionStart: function (ev) {
                    isDragging = false;
                    mouseFollower = new MouseFollower(seg.el, {
                        additionalClass: 'fc-dragging',
                        parentEl: view.el,
                        opacity: dragListener.isTouch ? null : view.opt('dragOpacity'),
                        revertDuration: view.opt('dragRevertDuration'),
                        zIndex: 2
                    });
                    mouseFollower.hide();
                    mouseFollower.start(ev);
                }, dragStart: function (ev) {
                    if (dragListener.isTouch && !view.isEventSelected(event)) {
                        view.selectEvent(event);
                    }
                    isDragging = true;
                    _this.handleSegMouseout(seg, ev);
                    _this.segDragStart(seg, ev);
                    view.hideEvent(event);
                }, hitOver: function (hit, isOrig, origHit) {
                    var dragHelperEls;
                    if (seg.hit) {
                        origHit = seg.hit;
                    }
                    dropLocation = _this.computeEventDrop(origHit.component.getHitSpan(origHit), hit.component.getHitSpan(hit), event);
                    if (dropLocation && !calendar.isEventSpanAllowed(_this.eventToSpan(dropLocation), event)) {
                        disableCursor();
                        dropLocation = null;
                    }
                    if (dropLocation && (dragHelperEls = view.renderDrag(dropLocation, seg))) {
                        dragHelperEls.addClass('fc-dragging');
                        if (!dragListener.isTouch) {
                            _this.applyDragOpacity(dragHelperEls);
                        }
                        mouseFollower.hide();
                    } else {
                        mouseFollower.show();
                    }
                    if (isOrig) {
                        dropLocation = null;
                    }
                }, hitOut: function () {
                    view.unrenderDrag();
                    mouseFollower.show();
                    dropLocation = null;
                }, hitDone: function () {
                    enableCursor();
                }, interactionEnd: function (ev) {
                    mouseFollower.stop(!dropLocation, function () {
                        if (isDragging) {
                            view.unrenderDrag();
                            view.showEvent(event);
                            _this.segDragStop(seg, ev);
                        }
                        if (dropLocation) {
                            view.reportEventDrop(event, dropLocation, this.largeUnit, el, ev);
                        }
                    });
                    _this.segDragListener = null;
                }
            });
            return dragListener;
        },
        buildSegSelectListener: function (seg) {
            var _this = this;
            var view = this.view;
            var event = seg.event;
            if (this.segDragListener) {
                return this.segDragListener;
            }
            var dragListener = this.segDragListener = new DragListener({
                dragStart: function (ev) {
                    if (dragListener.isTouch && !view.isEventSelected(event)) {
                        view.selectEvent(event);
                    }
                }, interactionEnd: function (ev) {
                    _this.segDragListener = null;
                }
            });
            return dragListener;
        },
        segDragStart: function (seg, ev) {
            this.isDraggingSeg = true;
            this.view.trigger('eventDragStart', seg.el[0], seg.event, ev, {});
        },
        segDragStop: function (seg, ev) {
            this.isDraggingSeg = false;
            this.view.trigger('eventDragStop', seg.el[0], seg.event, ev, {});
        },
        computeEventDrop: function (startSpan, endSpan, event) {
            var calendar = this.view.calendar;
            var dragStart = startSpan.start;
            var dragEnd = endSpan.start;
            var delta;
            var dropLocation;
            if (dragStart.hasTime() === dragEnd.hasTime()) {
                delta = this.diffDates(dragEnd, dragStart);
                if (event.allDay && durationHasTime(delta)) {
                    dropLocation = {start: event.start.clone(), end: calendar.getEventEnd(event), allDay: false};
                    calendar.normalizeEventTimes(dropLocation);
                } else {
                    dropLocation = {
                        start: event.start.clone(),
                        end: event.end ? event.end.clone() : null,
                        allDay: event.allDay
                    };
                }
                dropLocation.start.add(delta);
                if (dropLocation.end) {
                    dropLocation.end.add(delta);
                }
            } else {
                dropLocation = {start: dragEnd.clone(), end: null, allDay: !dragEnd.hasTime()};
            }
            return dropLocation;
        },
        applyDragOpacity: function (els) {
            var opacity = this.view.opt('dragOpacity');
            if (opacity != null) {
                els.each(function (i, node) {
                    node.style.opacity = opacity;
                });
            }
        },
        externalDragStart: function (ev, ui) {
            var view = this.view;
            var el;
            var accept;
            if (view.opt('droppable')) {
                el = $((ui ? ui.item : null) || ev.target);
                accept = view.opt('dropAccept');
                if ($.isFunction(accept) ? accept.call(el[0], el) : el.is(accept)) {
                    if (!this.isDraggingExternal) {
                        this.listenToExternalDrag(el, ev, ui);
                    }
                }
            }
        },
        listenToExternalDrag: function (el, ev, ui) {
            var _this = this;
            var calendar = this.view.calendar;
            var meta = getDraggedElMeta(el);
            var dropLocation;
            var dragListener = _this.externalDragListener = new HitDragListener(this, {
                interactionStart: function () {
                    _this.isDraggingExternal = true;
                }, hitOver: function (hit) {
                    dropLocation = _this.computeExternalDrop(hit.component.getHitSpan(hit), meta);
                    if (dropLocation && !calendar.isExternalSpanAllowed(_this.eventToSpan(dropLocation), dropLocation, meta.eventProps)) {
                        disableCursor();
                        dropLocation = null;
                    }
                    if (dropLocation) {
                        _this.renderDrag(dropLocation);
                    }
                }, hitOut: function () {
                    dropLocation = null;
                }, hitDone: function () {
                    enableCursor();
                    _this.unrenderDrag();
                }, interactionEnd: function (ev) {
                    if (dropLocation) {
                        _this.view.reportExternalDrop(meta, dropLocation, el, ev, ui);
                    }
                    _this.isDraggingExternal = false;
                    _this.externalDragListener = null;
                }
            });
            dragListener.startDrag(ev);
        },
        computeExternalDrop: function (span, meta) {
            var calendar = this.view.calendar;
            var dropLocation = {start: calendar.applyTimezone(span.start), end: null};
            if (meta.startTime && !dropLocation.start.hasTime()) {
                dropLocation.start.time(meta.startTime);
            }
            if (meta.duration) {
                dropLocation.end = dropLocation.start.clone().add(meta.duration);
            }
            return dropLocation;
        },
        renderDrag: function (dropLocation, seg) {
        },
        unrenderDrag: function () {
        },
        buildSegResizeListener: function (seg, isStart) {
            var _this = this;
            var view = this.view;
            var calendar = view.calendar;
            var el = seg.el;
            var event = seg.event;
            var eventEnd = calendar.getEventEnd(event);
            var isDragging;
            var resizeLocation;
            var dragListener = this.segResizeListener = new HitDragListener(this, {
                scroll: view.opt('dragScroll'), subjectEl: el, interactionStart: function () {
                    isDragging = false;
                }, dragStart: function (ev) {
                    isDragging = true;
                    _this.handleSegMouseout(seg, ev);
                    _this.segResizeStart(seg, ev);
                }, hitOver: function (hit, isOrig, origHit) {
                    var origHitSpan = _this.getHitSpan(origHit);
                    var hitSpan = _this.getHitSpan(hit);
                    resizeLocation = isStart ? _this.computeEventStartResize(origHitSpan, hitSpan, event) : _this.computeEventEndResize(origHitSpan, hitSpan, event);
                    if (resizeLocation) {
                        if (!calendar.isEventSpanAllowed(_this.eventToSpan(resizeLocation), event)) {
                            disableCursor();
                            resizeLocation = null;
                        } else if (resizeLocation.start.isSame(event.start) && resizeLocation.end.isSame(eventEnd)) {
                            resizeLocation = null;
                        }
                    }
                    if (resizeLocation) {
                        view.hideEvent(event);
                        _this.renderEventResize(resizeLocation, seg);
                    }
                }, hitOut: function () {
                    resizeLocation = null;
                }, hitDone: function () {
                    _this.unrenderEventResize();
                    view.showEvent(event);
                    enableCursor();
                }, interactionEnd: function (ev) {
                    if (isDragging) {
                        _this.segResizeStop(seg, ev);
                    }
                    if (resizeLocation) {
                        view.reportEventResize(event, resizeLocation, this.largeUnit, el, ev);
                    }
                    _this.segResizeListener = null;
                }
            });
            return dragListener;
        },
        segResizeStart: function (seg, ev) {
            this.isResizingSeg = true;
            this.view.trigger('eventResizeStart', seg.el[0], seg.event, ev, {});
        },
        segResizeStop: function (seg, ev) {
            this.isResizingSeg = false;
            this.view.trigger('eventResizeStop', seg.el[0], seg.event, ev, {});
        },
        computeEventStartResize: function (startSpan, endSpan, event) {
            return this.computeEventResize('start', startSpan, endSpan, event);
        },
        computeEventEndResize: function (startSpan, endSpan, event) {
            return this.computeEventResize('end', startSpan, endSpan, event);
        },
        computeEventResize: function (type, startSpan, endSpan, event) {
            var calendar = this.view.calendar;
            var delta = this.diffDates(endSpan[type], startSpan[type]);
            var resizeLocation;
            var defaultDuration;
            resizeLocation = {start: event.start.clone(), end: calendar.getEventEnd(event), allDay: event.allDay};
            if (resizeLocation.allDay && durationHasTime(delta)) {
                resizeLocation.allDay = false;
                calendar.normalizeEventTimes(resizeLocation);
            }
            resizeLocation[type].add(delta);
            if (!resizeLocation.start.isBefore(resizeLocation.end)) {
                defaultDuration = this.minResizeDuration || (event.allDay ? calendar.defaultAllDayEventDuration : calendar.defaultTimedEventDuration);
                if (type == 'start') {
                    resizeLocation.start = resizeLocation.end.clone().subtract(defaultDuration);
                } else {
                    resizeLocation.end = resizeLocation.start.clone().add(defaultDuration);
                }
            }
            return resizeLocation;
        },
        renderEventResize: function (range, seg) {
        },
        unrenderEventResize: function () {
        },
        getEventTimeText: function (range, formatStr, displayEnd) {
            if (formatStr == null) {
                formatStr = this.eventTimeFormat;
            }
            if (displayEnd == null) {
                displayEnd = this.displayEventEnd;
            }
            if (this.displayEventTime && range.start.hasTime()) {
                if (displayEnd && range.end) {
                    return this.view.formatRange(range, formatStr);
                } else {
                    return range.start.format(formatStr);
                }
            }
            return '';
        },
        getSegClasses: function (seg, isDraggable, isResizable) {
            var view = this.view;
            var event = seg.event;
            var classes = ['fc-event', seg.isStart ? 'fc-start' : 'fc-not-start', seg.isEnd ? 'fc-end' : 'fc-not-end'].concat(event.className, event.source ? event.source.className : []);
            if (isDraggable) {
                classes.push('fc-draggable');
            }
            if (isResizable) {
                classes.push('fc-resizable');
            }
            if (view.isEventSelected(event)) {
                classes.push('fc-selected');
            }
            return classes;
        },
        getSegSkinCss: function (seg) {
            var event = seg.event;
            var view = this.view;
            var source = event.source || {};
            var eventColor = event.color;
            var sourceColor = source.color;
            var optionColor = view.opt('eventColor');
            return {
                'background-color': event.backgroundColor || eventColor || source.backgroundColor || sourceColor || view.opt('eventBackgroundColor') || optionColor,
                'border-color': event.borderColor || eventColor || source.borderColor || sourceColor || view.opt('eventBorderColor') || optionColor,
                color: event.textColor || source.textColor || view.opt('eventTextColor')
            };
        },
        eventToSegs: function (event) {
            return this.eventsToSegs([event]);
        },
        eventToSpan: function (event) {
            return this.eventToSpans(event)[0];
        },
        eventToSpans: function (event) {
            var range = this.eventToRange(event);
            return this.eventRangeToSpans(range, event);
        },
        eventsToSegs: function (allEvents, segSliceFunc) {
            var _this = this;
            var eventsById = groupEventsById(allEvents);
            var segs = [];
            $.each(eventsById, function (id, events) {
                var ranges = [];
                var i;
                for (i = 0; i < events.length; i++) {
                    ranges.push(_this.eventToRange(events[i]));
                }
                if (isInverseBgEvent(events[0])) {
                    ranges = _this.invertRanges(ranges);
                    for (i = 0; i < ranges.length; i++) {
                        segs.push.apply(segs, _this.eventRangeToSegs(ranges[i], events[0], segSliceFunc));
                    }
                } else {
                    for (i = 0; i < ranges.length; i++) {
                        segs.push.apply(segs, _this.eventRangeToSegs(ranges[i], events[i], segSliceFunc));
                    }
                }
            });
            return segs;
        },
        eventToRange: function (event) {
            return {
                start: event.start.clone().stripZone(),
                end: (event.end ? event.end.clone() : this.view.calendar.getDefaultEventEnd(event.allDay != null ? event.allDay : !event.start.hasTime(), event.start)).stripZone()
            };
        },
        eventRangeToSegs: function (range, event, segSliceFunc) {
            var spans = this.eventRangeToSpans(range, event);
            var segs = [];
            var i;
            for (i = 0; i < spans.length; i++) {
                segs.push.apply(segs, this.eventSpanToSegs(spans[i], event, segSliceFunc));
            }
            return segs;
        },
        eventRangeToSpans: function (range, event) {
            return [$.extend({}, range)];
        },
        eventSpanToSegs: function (span, event, segSliceFunc) {
            var segs = segSliceFunc ? segSliceFunc(span) : this.spanToSegs(span);
            var i, seg;
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                seg.event = event;
                seg.eventStartMS = +span.start;
                seg.eventDurationMS = span.end - span.start;
            }
            return segs;
        },
        invertRanges: function (ranges) {
            var view = this.view;
            var viewStart = view.start.clone();
            var viewEnd = view.end.clone();
            var inverseRanges = [];
            var start = viewStart;
            var i, range;
            ranges.sort(compareRanges);
            for (i = 0; i < ranges.length; i++) {
                range = ranges[i];
                if (range.start > start) {
                    inverseRanges.push({start: start, end: range.start});
                }
                start = range.end;
            }
            if (start < viewEnd) {
                inverseRanges.push({start: start, end: viewEnd});
            }
            return inverseRanges;
        },
        sortEventSegs: function (segs) {
            segs.sort(proxy(this, 'compareEventSegs'));
        },
        compareEventSegs: function (seg1, seg2) {
            return seg1.eventStartMS - seg2.eventStartMS || seg2.eventDurationMS - seg1.eventDurationMS || seg2.event.allDay - seg1.event.allDay || compareByFieldSpecs(seg1.event, seg2.event, this.view.eventOrderSpecs);
        }
    });

    function isBgEvent(event) {
        var rendering = getEventRendering(event);
        return rendering === 'background' || rendering === 'inverse-background';
    }

    FC.isBgEvent = isBgEvent;

    function isInverseBgEvent(event) {
        return getEventRendering(event) === 'inverse-background';
    }

    function getEventRendering(event) {
        return firstDefined((event.source || {}).rendering, event.rendering);
    }

    function groupEventsById(events) {
        var eventsById = {};
        var i, event;
        for (i = 0; i < events.length; i++) {
            event = events[i];
            (eventsById[event._id] || (eventsById[event._id] = [])).push(event);
        }
        return eventsById;
    }

    function compareRanges(range1, range2) {
        return range1.start - range2.start;
    }

    FC.dataAttrPrefix = '';

    function getDraggedElMeta(el) {
        var prefix = FC.dataAttrPrefix;
        var eventProps;
        var startTime;
        var duration;
        var stick;
        if (prefix) {
            prefix += '-';
        }
        eventProps = el.data(prefix + 'event') || null;
        if (eventProps) {
            if (typeof eventProps === 'object') {
                eventProps = $.extend({}, eventProps);
            } else {
                eventProps = {};
            }
            startTime = eventProps.start;
            if (startTime == null) {
                startTime = eventProps.time;
            }
            duration = eventProps.duration;
            stick = eventProps.stick;
            delete eventProps.start;
            delete eventProps.time;
            delete eventProps.duration;
            delete eventProps.stick;
        }
        if (startTime == null) {
            startTime = el.data(prefix + 'start');
        }
        if (startTime == null) {
            startTime = el.data(prefix + 'time');
        }
        if (duration == null) {
            duration = el.data(prefix + 'duration');
        }
        if (stick == null) {
            stick = el.data(prefix + 'stick');
        }
        startTime = startTime != null ? moment.duration(startTime) : null;
        duration = duration != null ? moment.duration(duration) : null;
        stick = Boolean(stick);
        return {eventProps: eventProps, startTime: startTime, duration: duration, stick: stick};
    };
    ;var DayTableMixin = FC.DayTableMixin = {
        breakOnWeeks: false,
        dayDates: null,
        dayIndices: null,
        daysPerRow: null,
        rowCnt: null,
        colCnt: null,
        colHeadFormat: null,
        updateDayTable: function () {
            var view = this.view;
            var date = this.start.clone();
            var dayIndex = -1;
            var dayIndices = [];
            var dayDates = [];
            var daysPerRow;
            var firstDay;
            var rowCnt;
            while (date.isBefore(this.end)) {
                if (view.isHiddenDay(date)) {
                    dayIndices.push(dayIndex + 0.5);
                } else {
                    dayIndex++;
                    dayIndices.push(dayIndex);
                    dayDates.push(date.clone());
                }
                date.add(1, 'days');
            }
            if (this.breakOnWeeks) {
                firstDay = dayDates[0].day();
                for (daysPerRow = 1; daysPerRow < dayDates.length; daysPerRow++) {
                    if (dayDates[daysPerRow].day() == firstDay) {
                        break;
                    }
                }
                rowCnt = Math.ceil(dayDates.length / daysPerRow);
            } else {
                rowCnt = 1;
                daysPerRow = dayDates.length;
            }
            this.dayDates = dayDates;
            this.dayIndices = dayIndices;
            this.daysPerRow = daysPerRow;
            this.rowCnt = rowCnt;
            this.updateDayTableCols();
        },
        updateDayTableCols: function () {
            this.colCnt = this.computeColCnt();
            this.colHeadFormat = this.view.opt('columnFormat') || this.computeColHeadFormat();
        },
        computeColCnt: function () {
            return this.daysPerRow;
        },
        getCellDate: function (row, col) {
            return this.dayDates[this.getCellDayIndex(row, col)].clone();
        },
        getCellRange: function (row, col) {
            var start = this.getCellDate(row, col);
            var end = start.clone().add(1, 'days');
            return {start: start, end: end};
        },
        getCellDayIndex: function (row, col) {
            return row * this.daysPerRow + this.getColDayIndex(col);
        },
        getColDayIndex: function (col) {
            if (this.isRTL) {
                return this.colCnt - 1 - col;
            } else {
                return col;
            }
        },
        getDateDayIndex: function (date) {
            var dayIndices = this.dayIndices;
            var dayOffset = date.diff(this.start, 'days');
            if (dayOffset < 0) {
                return dayIndices[0] - 1;
            } else if (dayOffset >= dayIndices.length) {
                return dayIndices[dayIndices.length - 1] + 1;
            } else {
                return dayIndices[dayOffset];
            }
        },
        computeColHeadFormat: function () {
            if (this.rowCnt > 1 || this.colCnt > 10) {
                return 'ddd';
            } else if (this.colCnt > 1) {
                return this.view.opt('dayOfMonthFormat');
            } else {
                return 'dddd';
            }
        },
        sliceRangeByRow: function (range) {
            var daysPerRow = this.daysPerRow;
            var normalRange = this.view.computeDayRange(range);
            var rangeFirst = this.getDateDayIndex(normalRange.start);
            var rangeLast = this.getDateDayIndex(normalRange.end.clone().subtract(1, 'days'));
            var segs = [];
            var row;
            var rowFirst, rowLast;
            var segFirst, segLast;
            for (row = 0; row < this.rowCnt; row++) {
                rowFirst = row * daysPerRow;
                rowLast = rowFirst + daysPerRow - 1;
                segFirst = Math.max(rangeFirst, rowFirst);
                segLast = Math.min(rangeLast, rowLast);
                segFirst = Math.ceil(segFirst);
                segLast = Math.floor(segLast);
                if (segFirst <= segLast) {
                    segs.push({
                        row: row,
                        firstRowDayIndex: segFirst - rowFirst,
                        lastRowDayIndex: segLast - rowFirst,
                        isStart: segFirst === rangeFirst,
                        isEnd: segLast === rangeLast
                    });
                }
            }
            return segs;
        },
        sliceRangeByDay: function (range) {
            var daysPerRow = this.daysPerRow;
            var normalRange = this.view.computeDayRange(range);
            var rangeFirst = this.getDateDayIndex(normalRange.start);
            var rangeLast = this.getDateDayIndex(normalRange.end.clone().subtract(1, 'days'));
            var segs = [];
            var row;
            var rowFirst, rowLast;
            var i;
            var segFirst, segLast;
            for (row = 0; row < this.rowCnt; row++) {
                rowFirst = row * daysPerRow;
                rowLast = rowFirst + daysPerRow - 1;
                for (i = rowFirst; i <= rowLast; i++) {
                    segFirst = Math.max(rangeFirst, i);
                    segLast = Math.min(rangeLast, i);
                    segFirst = Math.ceil(segFirst);
                    segLast = Math.floor(segLast);
                    if (segFirst <= segLast) {
                        segs.push({
                            row: row,
                            firstRowDayIndex: segFirst - rowFirst,
                            lastRowDayIndex: segLast - rowFirst,
                            isStart: segFirst === rangeFirst,
                            isEnd: segLast === rangeLast
                        });
                    }
                }
            }
            return segs;
        },
        renderHeadHtml: function () {
            var view = this.view;
            return '' +
                '<div class="fc-row ' + view.widgetHeaderClass + '">' +
                '<table>' +
                '<thead>' +
                this.renderHeadTrHtml() +
                '</thead>' +
                '</table>' +
                '</div>';
        },
        renderHeadIntroHtml: function () {
            return this.renderIntroHtml();
        },
        renderHeadTrHtml: function () {
            return '' +
                '<tr>' +
                (this.isRTL ? '' : this.renderHeadIntroHtml()) +
                this.renderHeadDateCellsHtml() +
                (this.isRTL ? this.renderHeadIntroHtml() : '') +
                '</tr>';
        },
        renderHeadDateCellsHtml: function () {
            var htmls = [];
            var col, date;
            for (col = 0; col < this.colCnt; col++) {
                date = this.getCellDate(0, col);
                htmls.push(this.renderHeadDateCellHtml(date));
            }
            return htmls.join('');
        },
        renderHeadDateCellHtml: function (date, colspan, otherAttrs) {
            var view = this.view;
            return '' +
                '<th class="fc-day-header ' + view.widgetHeaderClass + ' fc-' + dayIDs[date.day()] + '"' +
                (this.rowCnt == 1 ? ' data-date="' + date.format('YYYY-MM-DD') + '"' : '') +
                (colspan > 1 ? ' colspan="' + colspan + '"' : '') +
                (otherAttrs ? ' ' + otherAttrs : '') +
                '>' +
                htmlEscape(date.format(this.colHeadFormat)) +
                '</th>';
        },
        renderBgTrHtml: function (row) {
            return '' +
                '<tr>' +
                (this.isRTL ? '' : this.renderBgIntroHtml(row)) +
                this.renderBgCellsHtml(row) +
                (this.isRTL ? this.renderBgIntroHtml(row) : '') +
                '</tr>';
        },
        renderBgIntroHtml: function (row) {
            return this.renderIntroHtml();
        },
        renderBgCellsHtml: function (row) {
            var htmls = [];
            var col, date;
            for (col = 0; col < this.colCnt; col++) {
                date = this.getCellDate(row, col);
                htmls.push(this.renderBgCellHtml(date));
            }
            return htmls.join('');
        },
        renderBgCellHtml: function (date, otherAttrs) {
            var view = this.view;
            var classes = this.getDayClasses(date);
            classes.unshift('fc-day', view.widgetContentClass);
            return '<td class="' + classes.join(' ') + '"' +
                ' data-date="' + date.format('YYYY-MM-DD') + '"' +
                (otherAttrs ? ' ' + otherAttrs : '') +
                '></td>';
        },
        renderIntroHtml: function () {
        },
        bookendCells: function (trEl) {
            var introHtml = this.renderIntroHtml();
            if (introHtml) {
                if (this.isRTL) {
                    trEl.append(introHtml);
                } else {
                    trEl.prepend(introHtml);
                }
            }
        }
    };
    ;
    ;var DayGrid = FC.DayGrid = Grid.extend(DayTableMixin, {
        numbersVisible: false,
        bottomCoordPadding: 0,
        rowEls: null,
        cellEls: null,
        helperEls: null,
        rowCoordCache: null,
        colCoordCache: null,
        renderDates: function (isRigid) {
            var view = this.view;
            var rowCnt = this.rowCnt;
            var colCnt = this.colCnt;
            var html = '';
            var row;
            var col;
            for (row = 0; row < rowCnt; row++) {
                html += this.renderDayRowHtml(row, isRigid);
            }
            this.el.html(html);
            this.rowEls = this.el.find('.fc-row');
            this.cellEls = this.el.find('.fc-day');
            this.rowCoordCache = new CoordCache({els: this.rowEls, isVertical: true});
            this.colCoordCache = new CoordCache({els: this.cellEls.slice(0, this.colCnt), isHorizontal: true});
            for (row = 0; row < rowCnt; row++) {
                for (col = 0; col < colCnt; col++) {
                    view.trigger('dayRender', null, this.getCellDate(row, col), this.getCellEl(row, col));
                }
            }
        },
        unrenderDates: function () {
            this.removeSegPopover();
        },
        renderBusinessHours: function () {
            var events = this.view.calendar.getBusinessHoursEvents(true);
            var segs = this.eventsToSegs(events);
            this.renderFill('businessHours', segs, 'bgevent');
        },
        renderDayRowHtml: function (row, isRigid) {
            var view = this.view;
            var classes = ['fc-row', 'fc-week', view.widgetContentClass];
            if (isRigid) {
                classes.push('fc-rigid');
            }
            return '' +
                '<div class="' + classes.join(' ') + '">' +
                '<div class="fc-bg">' +
                '<table>' +
                this.renderBgTrHtml(row) +
                '</table>' +
                '</div>' +
                '<div class="fc-content-skeleton">' +
                '<table>' +
                (this.numbersVisible ? '<thead>' +
                    this.renderNumberTrHtml(row) +
                    '</thead>' : '') +
                '</table>' +
                '</div>' +
                '</div>';
        },
        renderNumberTrHtml: function (row) {
            return '' +
                '<tr>' +
                (this.isRTL ? '' : this.renderNumberIntroHtml(row)) +
                this.renderNumberCellsHtml(row) +
                (this.isRTL ? this.renderNumberIntroHtml(row) : '') +
                '</tr>';
        },
        renderNumberIntroHtml: function (row) {
            return this.renderIntroHtml();
        },
        renderNumberCellsHtml: function (row) {
            var htmls = [];
            var col, date;
            for (col = 0; col < this.colCnt; col++) {
                date = this.getCellDate(row, col);
                htmls.push(this.renderNumberCellHtml(date));
            }
            return htmls.join('');
        },
        renderNumberCellHtml: function (date) {
            var classes;
            if (!this.view.dayNumbersVisible) {
                return '<td/>';
            }
            classes = this.getDayClasses(date);
            classes.unshift('fc-day-number');
            return '' +
                '<td class="' + classes.join(' ') + '" data-date="' + date.format() + '">' +
                '<span>' + date.date() + '</span>' +
                '</td>';
        },
        computeEventTimeFormat: function () {
            return this.view.opt('extraSmallTimeFormat');
        },
        computeDisplayEventEnd: function () {
            return this.colCnt == 1;
        },
        rangeUpdated: function () {
            this.updateDayTable();
        },
        spanToSegs: function (span) {
            var segs = this.sliceRangeByRow(span);
            var i, seg;
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                if (this.isRTL) {
                    seg.leftCol = this.daysPerRow - 1 - seg.lastRowDayIndex;
                    seg.rightCol = this.daysPerRow - 1 - seg.firstRowDayIndex;
                } else {
                    seg.leftCol = seg.firstRowDayIndex;
                    seg.rightCol = seg.lastRowDayIndex;
                }
            }
            return segs;
        },
        prepareHits: function () {
            this.colCoordCache.build();
            this.rowCoordCache.build();
            this.rowCoordCache.bottoms[this.rowCnt - 1] += this.bottomCoordPadding;
        },
        releaseHits: function () {
            this.colCoordCache.clear();
            this.rowCoordCache.clear();
        },
        queryHit: function (leftOffset, topOffset) {
            var col = this.colCoordCache.getHorizontalIndex(leftOffset);
            var row = this.rowCoordCache.getVerticalIndex(topOffset);
            if (row != null && col != null) {
                return this.getCellHit(row, col);
            }
        },
        getHitSpan: function (hit) {
            return this.getCellRange(hit.row, hit.col);
        },
        getHitEl: function (hit) {
            return this.getCellEl(hit.row, hit.col);
        },
        getCellHit: function (row, col) {
            return {
                row: row,
                col: col,
                component: this,
                left: this.colCoordCache.getLeftOffset(col),
                right: this.colCoordCache.getRightOffset(col),
                top: this.rowCoordCache.getTopOffset(row),
                bottom: this.rowCoordCache.getBottomOffset(row)
            };
        },
        getCellEl: function (row, col) {
            return this.cellEls.eq(row * this.colCnt + col);
        },
        renderDrag: function (eventLocation, seg) {
            this.renderHighlight(this.eventToSpan(eventLocation));
            if (seg && !seg.el.closest(this.el).length) {
                return this.renderEventLocationHelper(eventLocation, seg);
            }
        },
        unrenderDrag: function () {
            this.unrenderHighlight();
            this.unrenderHelper();
        },
        renderEventResize: function (eventLocation, seg) {
            this.renderHighlight(this.eventToSpan(eventLocation));
            return this.renderEventLocationHelper(eventLocation, seg);
        },
        unrenderEventResize: function () {
            this.unrenderHighlight();
            this.unrenderHelper();
        },
        renderHelper: function (event, sourceSeg) {
            var helperNodes = [];
            var segs = this.eventToSegs(event);
            var rowStructs;
            segs = this.renderFgSegEls(segs);
            rowStructs = this.renderSegRows(segs);
            this.rowEls.each(function (row, rowNode) {
                var rowEl = $(rowNode);
                var skeletonEl = $('<div class="fc-helper-skeleton"><table/></div>');
                var skeletonTop;
                if (sourceSeg && sourceSeg.row === row) {
                    skeletonTop = sourceSeg.el.position().top;
                } else {
                    skeletonTop = rowEl.find('.fc-content-skeleton tbody').position().top;
                }
                skeletonEl.css('top', skeletonTop).find('table').append(rowStructs[row].tbodyEl);
                rowEl.append(skeletonEl);
                helperNodes.push(skeletonEl[0]);
            });
            return (this.helperEls = $(helperNodes));
        },
        unrenderHelper: function () {
            if (this.helperEls) {
                this.helperEls.remove();
                this.helperEls = null;
            }
        },
        fillSegTag: 'td',
        renderFill: function (type, segs, className) {
            var nodes = [];
            var i, seg;
            var skeletonEl;
            segs = this.renderFillSegEls(type, segs);
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                skeletonEl = this.renderFillRow(type, seg, className);
                this.rowEls.eq(seg.row).append(skeletonEl);
                nodes.push(skeletonEl[0]);
            }
            this.elsByFill[type] = $(nodes);
            return segs;
        },
        renderFillRow: function (type, seg, className) {
            var colCnt = this.colCnt;
            var startCol = seg.leftCol;
            var endCol = seg.rightCol + 1;
            var skeletonEl;
            var trEl;
            className = className || type.toLowerCase();
            skeletonEl = $('<div class="fc-' + className + '-skeleton">' +
                '<table><tr/></table>' +
                '</div>');
            trEl = skeletonEl.find('tr');
            if (startCol > 0) {
                trEl.append('<td colspan="' + startCol + '"/>');
            }
            trEl.append(seg.el.attr('colspan', endCol - startCol));
            if (endCol < colCnt) {
                trEl.append('<td colspan="' + (colCnt - endCol) + '"/>');
            }
            this.bookendCells(trEl);
            return skeletonEl;
        }
    });
    ;
    ;DayGrid.mixin({
        rowStructs: null, unrenderEvents: function () {
            this.removeSegPopover();
            Grid.prototype.unrenderEvents.apply(this, arguments);
        }, getEventSegs: function () {
            return Grid.prototype.getEventSegs.call(this).concat(this.popoverSegs || []);
        }, renderBgSegs: function (segs) {
            var allDaySegs = $.grep(segs, function (seg) {
                return seg.event.allDay;
            });
            return Grid.prototype.renderBgSegs.call(this, allDaySegs);
        }, renderFgSegs: function (segs) {
            var rowStructs;
            segs = this.renderFgSegEls(segs);
            rowStructs = this.rowStructs = this.renderSegRows(segs);
            this.rowEls.each(function (i, rowNode) {
                $(rowNode).find('.fc-content-skeleton > table').append(rowStructs[i].tbodyEl);
            });
            return segs;
        }, unrenderFgSegs: function () {
            var rowStructs = this.rowStructs || [];
            var rowStruct;
            while ((rowStruct = rowStructs.pop())) {
                rowStruct.tbodyEl.remove();
            }
            this.rowStructs = null;
        }, renderSegRows: function (segs) {
            var rowStructs = [];
            var segRows;
            var row;
            segRows = this.groupSegRows(segs);
            for (row = 0; row < segRows.length; row++) {
                rowStructs.push(this.renderSegRow(row, segRows[row]));
            }
            return rowStructs;
        }, fgSegHtml: function (seg, disableResizing) {
            var view = this.view;
            var event = seg.event;
            var isDraggable = view.isEventDraggable(event);
            var isResizableFromStart = !disableResizing && event.allDay && seg.isStart && view.isEventResizableFromStart(event);
            var isResizableFromEnd = !disableResizing && event.allDay && seg.isEnd && view.isEventResizableFromEnd(event);
            var classes = this.getSegClasses(seg, isDraggable, isResizableFromStart || isResizableFromEnd);
            var skinCss = cssToStr(this.getSegSkinCss(seg));
            var timeHtml = '';
            var timeText;
            var titleHtml;
            var trainerHtml = '';
            var levelHtml = '';
            var registerHtml;
            classes.unshift('fc-day-grid-event', 'fc-h-event');
            if (seg.isStart) {
                timeText = this.getEventTimeText(event);
                if (timeText) {
                    timeHtml = '<span class="fc-time">' + (timeText) + '</span>';
                }
            }
            trainerHtml = '<span class="fc-trainer">' + event.trainer + '</span>';
            levelHtml = '<span class="fc-level">' + event.trainer + '</span>';
            registerHtml = '<span> class="fc-register">' + event.register + '</span>';
            titleHtml = '<span class="fc-title">' +
                ((event.title || '') || '&nbsp;') +
                '</span>';
            $modalInfo = {};
            $modalInfo['coursId'] = (event.coursId);
            $modalInfo['title1'] = (event.title);
            $modalInfo['time'] = htmlEscape(timeText);
            $modalInfo['trainer'] = this.view.options.textWith + ' ' + event.trainer;
            $modalInfo['level'] = this.view.options.textLevel + ' ' + event.level;
            $modalInfo['categoryName'] = event.categoryName;
            $modalInfo['categoryColor'] = htmlEscape(event.categoryColor);
            $modalInfo['backgroundImage'] = event.backgroundImage;
            $modalInfo['url'] = htmlEscape(event.url);
            $modalInfo['excerpt'] = htmlEscape(event.excerpt);
            $modalInfo['address'] = htmlEscape(event.address);
            $modalInfo['register_link'] = htmlEscape(event.register);
            return '<a class="' + classes.join(' ') + '"' +
                (event.url ? ' href="' + htmlEscape(event.url) + '"' : '') +
                (this.view.options.dataModal ? ' data-modal="' + htmlEscape(this.view.options.dataModal) + '"' : '') +
                (skinCss ? ' style="' + skinCss + '"' : '') +
                '>' +
                '<div class="fc-content">' +
                (this.isRTL ? titleHtml + ' ' + timeHtml : timeHtml + ' ' + titleHtml) +
                (event.description ? '<div class="fc-description">' +
                    event.description +
                    '</div>' : '') +
                '</div>' +
                '<div class="fc-ribbon" style="background-color:' + event.categoryColor + '"></div>' +
                '<div class="fc-bg" />' +
                (isResizableFromStart ? '<div class="fc-resizer fc-start-resizer" />' : '') +
                (isResizableFromEnd ? '<div class="fc-resizer fc-end-resizer" />' : '') +
                '<input type="hidden" value=\'' + JSON.stringify($modalInfo) + '\'/>'
                +
                '</a>';
        }, renderSegRow: function (row, rowSegs) {
            var colCnt = this.colCnt;
            var segLevels = this.buildSegLevels(rowSegs);
            var levelCnt = Math.max(1, segLevels.length);
            var tbody = $('<tbody/>');
            var segMatrix = [];
            var cellMatrix = [];
            var loneCellMatrix = [];
            var i, levelSegs;
            var col;
            var tr;
            var j, seg;
            var td;

            function emptyCellsUntil(endCol) {
                while (col < endCol) {
                    td = (loneCellMatrix[i - 1] || [])[col];
                    if (td) {
                        td.attr('rowspan', parseInt(td.attr('rowspan') || 1, 10) + 1);
                    } else {
                        td = $('<td/>');
                        tr.append(td);
                    }
                    cellMatrix[i][col] = td;
                    loneCellMatrix[i][col] = td;
                    col++;
                }
            }

            for (i = 0; i < levelCnt; i++) {
                levelSegs = segLevels[i];
                col = 0;
                tr = $('<tr/>');
                segMatrix.push([]);
                cellMatrix.push([]);
                loneCellMatrix.push([]);
                if (levelSegs) {
                    for (j = 0; j < levelSegs.length; j++) {
                        seg = levelSegs[j];
                        emptyCellsUntil(seg.leftCol);
                        td = $('<td class="fc-event-container"/>').append(seg.el);
                        if (seg.leftCol != seg.rightCol) {
                            td.attr('colspan', seg.rightCol - seg.leftCol + 1);
                        } else {
                            loneCellMatrix[i][col] = td;
                        }
                        while (col <= seg.rightCol) {
                            cellMatrix[i][col] = td;
                            segMatrix[i][col] = seg;
                            col++;
                        }
                        tr.append(td);
                    }
                }
                emptyCellsUntil(colCnt);
                this.bookendCells(tr);
                tbody.append(tr);
            }
            return {
                row: row,
                tbodyEl: tbody,
                cellMatrix: cellMatrix,
                segMatrix: segMatrix,
                segLevels: segLevels,
                segs: rowSegs
            };
        }, buildSegLevels: function (segs) {
            var levels = [];
            var i, seg;
            var j;
            this.sortEventSegs(segs);
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                for (j = 0; j < levels.length; j++) {
                    if (!isDaySegCollision(seg, levels[j])) {
                        break;
                    }
                }
                seg.level = j;
                (levels[j] || (levels[j] = [])).push(seg);
            }
            for (j = 0; j < levels.length; j++) {
                levels[j].sort(compareDaySegCols);
            }
            return levels;
        }, groupSegRows: function (segs) {
            var segRows = [];
            var i;
            for (i = 0; i < this.rowCnt; i++) {
                segRows.push([]);
            }
            for (i = 0; i < segs.length; i++) {
                segRows[segs[i].row].push(segs[i]);
            }
            return segRows;
        }
    });

    function isDaySegCollision(seg, otherSegs) {
        var i, otherSeg;
        for (i = 0; i < otherSegs.length; i++) {
            otherSeg = otherSegs[i];
            if (otherSeg.leftCol <= seg.rightCol && otherSeg.rightCol >= seg.leftCol) {
                return true;
            }
        }
        return false;
    }

    function compareDaySegCols(a, b) {
        return a.leftCol - b.leftCol;
    };
    ;DayGrid.mixin({
        segPopover: null, popoverSegs: null, removeSegPopover: function () {
            if (this.segPopover) {
                this.segPopover.hide();
            }
        }, limitRows: function (levelLimit) {
            var rowStructs = this.rowStructs || [];
            var row;
            var rowLevelLimit;
            for (row = 0; row < rowStructs.length; row++) {
                this.unlimitRow(row);
                if (!levelLimit) {
                    rowLevelLimit = false;
                } else if (typeof levelLimit === 'number') {
                    rowLevelLimit = levelLimit;
                } else {
                    rowLevelLimit = this.computeRowLevelLimit(row);
                }
                if (rowLevelLimit !== false) {
                    this.limitRow(row, rowLevelLimit);
                }
            }
        }, computeRowLevelLimit: function (row) {
            var rowEl = this.rowEls.eq(row);
            var rowHeight = rowEl.height();
            var trEls = this.rowStructs[row].tbodyEl.children();
            var i, trEl;
            var trHeight;

            function iterInnerHeights(i, childNode) {
                trHeight = Math.max(trHeight, $(childNode).outerHeight());
            }

            for (i = 0; i < trEls.length; i++) {
                trEl = trEls.eq(i).removeClass('fc-limited');
                trHeight = 0;
                trEl.find('> td > :first-child').each(iterInnerHeights);
                if (trEl.position().top + trHeight > rowHeight) {
                    return i;
                }
            }
            return false;
        }, limitRow: function (row, levelLimit) {
            var _this = this;
            var rowStruct = this.rowStructs[row];
            var moreNodes = [];
            var col = 0;
            var levelSegs;
            var cellMatrix;
            var limitedNodes;
            var i, seg;
            var segsBelow;
            var totalSegsBelow;
            var colSegsBelow;
            var td, rowspan;
            var segMoreNodes;
            var j;
            var moreTd, moreWrap, moreLink;

            function emptyCellsUntil(endCol) {
                while (col < endCol) {
                    segsBelow = _this.getCellSegs(row, col, levelLimit);
                    if (segsBelow.length) {
                        td = cellMatrix[levelLimit - 1][col];
                        moreLink = _this.renderMoreLink(row, col, segsBelow);
                        moreWrap = $('<div/>').append(moreLink);
                        td.append(moreWrap);
                        moreNodes.push(moreWrap[0]);
                    }
                    col++;
                }
            }

            if (levelLimit && levelLimit < rowStruct.segLevels.length) {
                levelSegs = rowStruct.segLevels[levelLimit - 1];
                cellMatrix = rowStruct.cellMatrix;
                limitedNodes = rowStruct.tbodyEl.children().slice(levelLimit).addClass('fc-limited').get();
                for (i = 0; i < levelSegs.length; i++) {
                    seg = levelSegs[i];
                    emptyCellsUntil(seg.leftCol);
                    colSegsBelow = [];
                    totalSegsBelow = 0;
                    while (col <= seg.rightCol) {
                        segsBelow = this.getCellSegs(row, col, levelLimit);
                        colSegsBelow.push(segsBelow);
                        totalSegsBelow += segsBelow.length;
                        col++;
                    }
                    if (totalSegsBelow) {
                        td = cellMatrix[levelLimit - 1][seg.leftCol];
                        rowspan = td.attr('rowspan') || 1;
                        segMoreNodes = [];
                        for (j = 0; j < colSegsBelow.length; j++) {
                            moreTd = $('<td class="fc-more-cell"/>').attr('rowspan', rowspan);
                            segsBelow = colSegsBelow[j];
                            moreLink = this.renderMoreLink(row, seg.leftCol + j, [seg].concat(segsBelow));
                            moreWrap = $('<div/>').append(moreLink);
                            moreTd.append(moreWrap);
                            segMoreNodes.push(moreTd[0]);
                            moreNodes.push(moreTd[0]);
                        }
                        td.addClass('fc-limited').after($(segMoreNodes));
                        limitedNodes.push(td[0]);
                    }
                }
                emptyCellsUntil(this.colCnt);
                rowStruct.moreEls = $(moreNodes);
                rowStruct.limitedEls = $(limitedNodes);
            }
        }, unlimitRow: function (row) {
            var rowStruct = this.rowStructs[row];
            if (rowStruct.moreEls) {
                rowStruct.moreEls.remove();
                rowStruct.moreEls = null;
            }
            if (rowStruct.limitedEls) {
                rowStruct.limitedEls.removeClass('fc-limited');
                rowStruct.limitedEls = null;
            }
        }, renderMoreLink: function (row, col, hiddenSegs) {
            var _this = this;
            var view = this.view;
            return $('<a class="fc-more"/>').text(this.getMoreLinkText(hiddenSegs.length)).on('click', function (ev) {
                var clickOption = view.opt('eventLimitClick');
                var date = _this.getCellDate(row, col);
                var moreEl = $(this);
                var dayEl = _this.getCellEl(row, col);
                var allSegs = _this.getCellSegs(row, col);
                var reslicedAllSegs = _this.resliceDaySegs(allSegs, date);
                var reslicedHiddenSegs = _this.resliceDaySegs(hiddenSegs, date);
                if (typeof clickOption === 'function') {
                    clickOption = view.trigger('eventLimitClick', null, {
                        date: date,
                        dayEl: dayEl,
                        moreEl: moreEl,
                        segs: reslicedAllSegs,
                        hiddenSegs: reslicedHiddenSegs
                    }, ev);
                }
                if (clickOption === 'popover') {
                    _this.showSegPopover(row, col, moreEl, reslicedAllSegs);
                } else if (typeof clickOption === 'string') {
                    view.calendar.zoomTo(date, clickOption);
                }
                ModalEffectsInit();
            });
        }, showSegPopover: function (row, col, moreLink, segs) {
            var _this = this;
            var view = this.view;
            var moreWrap = moreLink.parent();
            var topEl;
            var options;
            if (this.rowCnt == 1) {
                topEl = view.el;
            } else {
                topEl = this.rowEls.eq(row);
            }
            options = {
                className: 'fc-more-popover',
                content: this.renderSegPopoverContent(row, col, segs),
                parentEl: this.el,
                top: topEl.offset().top,
                autoHide: true,
                viewportConstrain: view.opt('popoverViewportConstrain'),
                hide: function () {
                    _this.segPopover.removeElement();
                    _this.segPopover = null;
                    _this.popoverSegs = null;
                }
            };
            if (this.isRTL) {
                options.right = moreWrap.offset().left + moreWrap.outerWidth() + 1;
            } else {
                options.left = moreWrap.offset().left - 1;
            }
            this.segPopover = new Popover(options);
            this.segPopover.show();
        }, renderSegPopoverContent: function (row, col, segs) {
            var view = this.view;
            var isTheme = view.opt('theme');
            var title = this.getCellDate(row, col).format(view.opt('dayPopoverFormat'));
            var content = $('<div class="fc-header ' + view.widgetHeaderClass + '">' +
                '<span class="fc-close ' +
                (isTheme ? 'ui-icon ui-icon-closethick' : 'fc-icon fc-icon-x') +
                '"></span>' +
                '<span class="fc-title">' +
                (title) +
                '</span>' +
                '<div class="fc-clear"/>' +
                '</div>' +
                '<div class="fc-body ' + view.widgetContentClass + '">' +
                '<div class="fc-event-container"></div>' +
                '</div>');
            var segContainer = content.find('.fc-event-container');
            var i;
            segs = this.renderFgSegEls(segs, true);
            this.popoverSegs = segs;
            for (i = 0; i < segs.length; i++) {
                this.prepareHits();
                segs[i].hit = this.getCellHit(row, col);
                this.releaseHits();
                segContainer.append(segs[i].el);
            }
            return content;
        }, resliceDaySegs: function (segs, dayDate) {
            var events = $.map(segs, function (seg) {
                return seg.event;
            });
            var dayStart = dayDate.clone();
            var dayEnd = dayStart.clone().add(1, 'days');
            var dayRange = {start: dayStart, end: dayEnd};
            segs = this.eventsToSegs(events, function (range) {
                var seg = intersectRanges(range, dayRange);
                return seg ? [seg] : [];
            });
            this.sortEventSegs(segs);
            return segs;
        }, getMoreLinkText: function (num) {
            var opt = this.view.opt('eventLimitText');
            if (typeof opt === 'function') {
                return opt(num);
            } else {
                return '+' + num + ' ' + opt;
            }
        }, getCellSegs: function (row, col, startLevel) {
            var segMatrix = this.rowStructs[row].segMatrix;
            var level = startLevel || 0;
            var segs = [];
            var seg;
            while (level < segMatrix.length) {
                seg = segMatrix[level][col];
                if (seg) {
                    segs.push(seg);
                }
                level++;
            }
            return segs;
        }
    });
    ;
    ;var TimeGrid = FC.TimeGrid = Grid.extend(DayTableMixin, {
        slotDuration: null,
        snapDuration: null,
        snapsPerSlot: null,
        minTime: null,
        maxTime: null,
        labelFormat: null,
        labelInterval: null,
        colEls: null,
        slatContainerEl: null,
        slatEls: null,
        nowIndicatorEls: null,
        colCoordCache: null,
        slatCoordCache: null,
        constructor: function () {
            Grid.apply(this, arguments);
            this.processOptions();
        },
        renderDates: function () {
            this.el.html(this.renderHtml());
            this.colEls = this.el.find('.fc-day');
            this.slatContainerEl = this.el.find('.fc-slats');
            this.slatEls = this.slatContainerEl.find('tr');
            this.colCoordCache = new CoordCache({els: this.colEls, isHorizontal: true});
            this.slatCoordCache = new CoordCache({els: this.slatEls, isVertical: true});
            this.renderContentSkeleton();
        },
        renderHtml: function () {
            return '' +
                '<div class="fc-bg">' +
                '<table>' +
                this.renderBgTrHtml(0) +
                '</table>' +
                '</div>' +
                '<div class="fc-slats">' +
                '<table>' +
                this.renderSlatRowHtml() +
                '</table>' +
                '</div>';
        },
        renderSlatRowHtml: function () {
            var view = this.view;
            var isRTL = this.isRTL;
            var html = '';
            var slotTime = moment.duration(+this.minTime);
            var slotDate;
            var isLabeled;
            var axisHtml;
            while (slotTime < this.maxTime) {
                slotDate = this.start.clone().time(slotTime);
                isLabeled = isInt(divideDurationByDuration(slotTime, this.labelInterval));
                var hideTimeRange = this.view.options.hideTimeRange.split(',');
                if (hideTimeRange.indexOf(slotDate.hour().toString()) >= 0) {
                    slotTime.add(this.slotDuration);
                    continue;
                }
                axisHtml = '<td class="fc-axis fc-time ' + view.widgetContentClass + '" ' + view.axisStyleAttr() + '>' +
                    (isLabeled ? '<span>' +
                        htmlEscape(slotDate.format(this.labelFormat)) +
                        '</span>' : '') +
                    '</td>';
                html += '<tr data-time="' + slotDate.format('HH:mm:ss') + '"' +
                    (isLabeled ? '' : ' class="fc-minor"') +
                    '>' +
                    (!isRTL ? axisHtml : '') +
                    '<td class="' + view.widgetContentClass + '"/>' +
                    (isRTL ? axisHtml : '') +
                    "</tr>";
                slotTime.add(this.slotDuration);
            }
            return html;
        },
        processOptions: function () {
            var view = this.view;
            var slotDuration = view.opt('slotDuration');
            var snapDuration = view.opt('snapDuration');
            var input;
            slotDuration = moment.duration(slotDuration);
            snapDuration = snapDuration ? moment.duration(snapDuration) : slotDuration;
            this.slotDuration = slotDuration;
            this.snapDuration = snapDuration;
            this.snapsPerSlot = slotDuration / snapDuration;
            this.minResizeDuration = snapDuration;
            this.minTime = moment.duration(view.opt('minTime'));
            this.maxTime = moment.duration(view.opt('maxTime'));
            input = view.opt('slotLabelFormat');
            if ($.isArray(input)) {
                input = input[input.length - 1];
            }
            this.labelFormat = input || view.opt('axisFormat') || view.opt('smallTimeFormat');
            input = view.opt('slotLabelInterval');
            this.labelInterval = input ? moment.duration(input) : this.computeLabelInterval(slotDuration);
        },
        computeLabelInterval: function (slotDuration) {
            var i;
            var labelInterval;
            var slotsPerLabel;
            for (i = AGENDA_STOCK_SUB_DURATIONS.length - 1; i >= 0; i--) {
                labelInterval = moment.duration(AGENDA_STOCK_SUB_DURATIONS[i]);
                slotsPerLabel = divideDurationByDuration(labelInterval, slotDuration);
                if (isInt(slotsPerLabel) && slotsPerLabel > 1) {
                    return labelInterval;
                }
            }
            return moment.duration(slotDuration);
        },
        computeEventTimeFormat: function () {
            return this.view.opt('noMeridiemTimeFormat');
        },
        computeDisplayEventEnd: function () {
            return true;
        },
        prepareHits: function () {
            this.colCoordCache.build();
            this.slatCoordCache.build();
        },
        releaseHits: function () {
            this.colCoordCache.clear();
        },
        queryHit: function (leftOffset, topOffset) {
            var snapsPerSlot = this.snapsPerSlot;
            var colCoordCache = this.colCoordCache;
            var slatCoordCache = this.slatCoordCache;
            var colIndex = colCoordCache.getHorizontalIndex(leftOffset);
            var slatIndex = slatCoordCache.getVerticalIndex(topOffset);
            if (colIndex != null && slatIndex != null) {
                var slatTop = slatCoordCache.getTopOffset(slatIndex);
                var slatHeight = slatCoordCache.getHeight(slatIndex);
                var partial = (topOffset - slatTop) / slatHeight;
                var localSnapIndex = Math.floor(partial * snapsPerSlot);
                var snapIndex = slatIndex * snapsPerSlot + localSnapIndex;
                var snapTop = slatTop + (localSnapIndex / snapsPerSlot) * slatHeight;
                var snapBottom = slatTop + ((localSnapIndex + 1) / snapsPerSlot) * slatHeight;
                return {
                    col: colIndex,
                    snap: snapIndex,
                    component: this,
                    left: colCoordCache.getLeftOffset(colIndex),
                    right: colCoordCache.getRightOffset(colIndex),
                    top: snapTop,
                    bottom: snapBottom
                };
            }
        },
        getHitSpan: function (hit) {
            var start = this.getCellDate(0, hit.col);
            var time = this.computeSnapTime(hit.snap);
            var end;
            start.time(time);
            end = start.clone().add(this.snapDuration);
            return {start: start, end: end};
        },
        getHitEl: function (hit) {
            return this.colEls.eq(hit.col);
        },
        rangeUpdated: function () {
            this.updateDayTable();
        },
        computeSnapTime: function (snapIndex) {
            return moment.duration(this.minTime + this.snapDuration * snapIndex);
        },
        spanToSegs: function (span) {
            var segs = this.sliceRangeByTimes(span);
            var i;
            for (i = 0; i < segs.length; i++) {
                if (this.isRTL) {
                    segs[i].col = this.daysPerRow - 1 - segs[i].dayIndex;
                } else {
                    segs[i].col = segs[i].dayIndex;
                }
            }
            return segs;
        },
        sliceRangeByTimes: function (range) {
            var segs = [];
            var seg;
            var dayIndex;
            var dayDate;
            var dayRange;
            for (dayIndex = 0; dayIndex < this.daysPerRow; dayIndex++) {
                dayDate = this.dayDates[dayIndex].clone();
                dayRange = {start: dayDate.clone().time(this.minTime), end: dayDate.clone().time(this.maxTime)};
                seg = intersectRanges(range, dayRange);
                if (seg) {
                    seg.dayIndex = dayIndex;
                    segs.push(seg);
                }
            }
            return segs;
        },
        updateSize: function (isResize) {
            this.slatCoordCache.build();
            if (isResize) {
                this.updateSegVerticals([].concat(this.fgSegs || [], this.bgSegs || [], this.businessSegs || []));
            }
        },
        getTotalSlatHeight: function () {
            return this.slatContainerEl.outerHeight();
        },
        computeDateTop: function (date, startOfDayDate) {
            return this.computeTimeTop(moment.duration(date - startOfDayDate.clone().stripTime()));
        },
        computeTimeTop: function (time) {
            var len = this.slatEls.length;
            var slatCoverage = (time - this.minTime) / this.slotDuration;
            var slatIndex;
            var slatRemainder;
            slatCoverage = Math.max(0, slatCoverage);
            slatCoverage = Math.min(len, slatCoverage);
            slatIndex = Math.floor(slatCoverage);
            slatIndex = Math.min(slatIndex, len - 1);
            slatRemainder = slatCoverage - slatIndex;
            return this.slatCoordCache.getTopPosition(slatIndex) +
                this.slatCoordCache.getHeight(slatIndex) * slatRemainder;
        },
        renderDrag: function (eventLocation, seg) {
            if (seg) {
                return this.renderEventLocationHelper(eventLocation, seg);
            } else {
                this.renderHighlight(this.eventToSpan(eventLocation));
            }
        },
        unrenderDrag: function () {
            this.unrenderHelper();
            this.unrenderHighlight();
        },
        renderEventResize: function (eventLocation, seg) {
            return this.renderEventLocationHelper(eventLocation, seg);
        },
        unrenderEventResize: function () {
            this.unrenderHelper();
        },
        renderHelper: function (event, sourceSeg) {
            return this.renderHelperSegs(this.eventToSegs(event), sourceSeg);
        },
        unrenderHelper: function () {
            this.unrenderHelperSegs();
        },
        renderBusinessHours: function () {
            var events = this.view.calendar.getBusinessHoursEvents();
            var segs = this.eventsToSegs(events);
            this.renderBusinessSegs(segs);
        },
        unrenderBusinessHours: function () {
            this.unrenderBusinessSegs();
        },
        getNowIndicatorUnit: function () {
            return 'minute';
        },
        renderNowIndicator: function (date) {
            var segs = this.spanToSegs({start: date, end: date});
            var top = this.computeDateTop(date, date);
            var nodes = [];
            var i;
            for (i = 0; i < segs.length; i++) {
                nodes.push($('<div class="fc-now-indicator fc-now-indicator-line"></div>').css('top', top).appendTo(this.colContainerEls.eq(segs[i].col))[0]);
            }
            if (segs.length > 0) {
                nodes.push($('<div class="fc-now-indicator fc-now-indicator-arrow"></div>').css('top', top).appendTo(this.el.find('.fc-content-skeleton'))[0]);
            }
            this.nowIndicatorEls = $(nodes);
        },
        unrenderNowIndicator: function () {
            if (this.nowIndicatorEls) {
                this.nowIndicatorEls.remove();
                this.nowIndicatorEls = null;
            }
        },
        renderSelection: function (span) {
            if (this.view.opt('selectHelper')) {
                this.renderEventLocationHelper(span);
            } else {
                this.renderHighlight(span);
            }
        },
        unrenderSelection: function () {
            this.unrenderHelper();
            this.unrenderHighlight();
        },
        renderHighlight: function (span) {
            this.renderHighlightSegs(this.spanToSegs(span));
        },
        unrenderHighlight: function () {
            this.unrenderHighlightSegs();
        }
    });
    ;
    ;TimeGrid.mixin({
        colContainerEls: null,
        fgContainerEls: null,
        bgContainerEls: null,
        helperContainerEls: null,
        highlightContainerEls: null,
        businessContainerEls: null,
        fgSegs: null,
        bgSegs: null,
        helperSegs: null,
        highlightSegs: null,
        businessSegs: null,
        renderContentSkeleton: function () {
            var cellHtml = '';
            var i;
            var skeletonEl;
            for (i = 0; i < this.colCnt; i++) {
                cellHtml += '<td>' +
                    '<div class="fc-content-col">' +
                    '<div class="fc-event-container fc-helper-container"></div>' +
                    '<div class="fc-event-container"></div>' +
                    '<div class="fc-highlight-container"></div>' +
                    '<div class="fc-bgevent-container"></div>' +
                    '<div class="fc-business-container"></div>' +
                    '</div>' +
                    '</td>';
            }
            skeletonEl = $('<div class="fc-content-skeleton">' +
                '<table>' +
                '<tr>' + cellHtml + '</tr>' +
                '</table>' +
                '</div>');
            this.colContainerEls = skeletonEl.find('.fc-content-col');
            this.helperContainerEls = skeletonEl.find('.fc-helper-container');
            this.fgContainerEls = skeletonEl.find('.fc-event-container:not(.fc-helper-container)');
            this.bgContainerEls = skeletonEl.find('.fc-bgevent-container');
            this.highlightContainerEls = skeletonEl.find('.fc-highlight-container');
            this.businessContainerEls = skeletonEl.find('.fc-business-container');
            this.bookendCells(skeletonEl.find('tr'));
            this.el.append(skeletonEl);
        },
        renderFgSegs: function (segs) {
            segs = this.renderFgSegsIntoContainers(segs, this.fgContainerEls);
            this.fgSegs = segs;
            return segs;
        },
        unrenderFgSegs: function () {
            this.unrenderNamedSegs('fgSegs');
        },
        renderHelperSegs: function (segs, sourceSeg) {
            var helperEls = [];
            var i, seg;
            var sourceEl;
            segs = this.renderFgSegsIntoContainers(segs, this.helperContainerEls);
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                if (sourceSeg && sourceSeg.col === seg.col) {
                    sourceEl = sourceSeg.el;
                    seg.el.css({
                        left: sourceEl.css('left'),
                        right: sourceEl.css('right'),
                        'margin-left': sourceEl.css('margin-left'),
                        'margin-right': sourceEl.css('margin-right')
                    });
                }
                helperEls.push(seg.el[0]);
            }
            this.helperSegs = segs;
            return $(helperEls);
        },
        unrenderHelperSegs: function () {
            this.unrenderNamedSegs('helperSegs');
        },
        renderBgSegs: function (segs) {
            segs = this.renderFillSegEls('bgEvent', segs);
            this.updateSegVerticals(segs);
            this.attachSegsByCol(this.groupSegsByCol(segs), this.bgContainerEls);
            this.bgSegs = segs;
            return segs;
        },
        unrenderBgSegs: function () {
            this.unrenderNamedSegs('bgSegs');
        },
        renderHighlightSegs: function (segs) {
            segs = this.renderFillSegEls('highlight', segs);
            this.updateSegVerticals(segs);
            this.attachSegsByCol(this.groupSegsByCol(segs), this.highlightContainerEls);
            this.highlightSegs = segs;
        },
        unrenderHighlightSegs: function () {
            this.unrenderNamedSegs('highlightSegs');
        },
        renderBusinessSegs: function (segs) {
            segs = this.renderFillSegEls('businessHours', segs);
            this.updateSegVerticals(segs);
            this.attachSegsByCol(this.groupSegsByCol(segs), this.businessContainerEls);
            this.businessSegs = segs;
        },
        unrenderBusinessSegs: function () {
            this.unrenderNamedSegs('businessSegs');
        },
        groupSegsByCol: function (segs) {
            var segsByCol = [];
            var i;
            for (i = 0; i < this.colCnt; i++) {
                segsByCol.push([]);
            }
            for (i = 0; i < segs.length; i++) {
                segsByCol[segs[i].col].push(segs[i]);
            }
            return segsByCol;
        },
        attachSegsByCol: function (segsByCol, containerEls) {
            var col;
            var segs;
            var i;
            for (col = 0; col < this.colCnt; col++) {
                segs = segsByCol[col];
                for (i = 0; i < segs.length; i++) {
                    containerEls.eq(col).append(segs[i].el);
                }
            }
        },
        unrenderNamedSegs: function (propName) {
            var segs = this[propName];
            var i;
            if (segs) {
                for (i = 0; i < segs.length; i++) {
                    segs[i].el.remove();
                }
                this[propName] = null;
            }
        },
        renderFgSegsIntoContainers: function (segs, containerEls) {
            var segsByCol;
            var col;
            segs = this.renderFgSegEls(segs);
            segsByCol = this.groupSegsByCol(segs);
            for (col = 0; col < this.colCnt; col++) {
                this.updateFgSegCoords(segsByCol[col]);
            }
            this.attachSegsByCol(segsByCol, containerEls);
            return segs;
        },
        fgSegHtml: function (seg, disableResizing) {
            var view = this.view;
            var event = seg.event;
            var isDraggable = view.isEventDraggable(event);
            var isResizableFromStart = !disableResizing && seg.isStart && view.isEventResizableFromStart(event);
            var isResizableFromEnd = !disableResizing && seg.isEnd && view.isEventResizableFromEnd(event);
            var classes = this.getSegClasses(seg, isDraggable, isResizableFromStart || isResizableFromEnd);
            var skinCss = cssToStr(this.getSegSkinCss(seg));
            var timeText;
            var fullTimeText;
            var startTimeText;
            var trainerHtml = '';
            var levelHtml = '';
            var addressHtml = '';
            classes.unshift('fc-time-grid-event', 'fc-v-event');
            if (view.isMultiDayEvent(event)) {
                if (seg.isStart || seg.isEnd) {
                    timeText = this.getEventTimeText(seg);
                    fullTimeText = this.getEventTimeText(seg, 'LT');
                    startTimeText = this.getEventTimeText(seg, null, false);
                }
            } else {
                timeText = this.getEventTimeText(event);
                fullTimeText = this.getEventTimeText(event, 'LT');
                startTimeText = this.getEventTimeText(event, null, false);
            }
            trainerHtml = '<div class="fc-trainer">' + event.trainer + '</div>';
            levelHtml = '<div class="fc-level">' + event.level + '</div>';
            addressHtml = '<span class="fc-address">' + htmlEscape(event.address) + '</span>';
            $modalInfo = {};
            $modalInfo['coursId'] = (event.coursId);
            $modalInfo['title'] = (event.title);
            $modalInfo['time'] = htmlEscape(timeText);
            $modalInfo['trainer'] = this.view.options.textWith + ' ' + event.trainer;
            $modalInfo['level'] = this.view.options.textWith + ' ' + event.level;
            $modalInfo['categoryName'] = event.categoryName;
            $modalInfo['categoryColor'] = htmlEscape(event.categoryColor);
            $modalInfo['backgroundImage'] = event.backgroundImage;
            $modalInfo['url'] = htmlEscape(event.url);
            $modalInfo['register_link'] = htmlEscape(event.register_link);
            $modalInfo['excerpt'] = htmlEscape(event.excerpt);
            $modalInfo['address'] = htmlEscape(event.address);
            return '<a class="' + classes.join(' ') + '"' +
                (event.url ? ' href="' + htmlEscape(event.url) + '"' : '') +
                (this.view.options.dataModal ? ' data-modal="' + htmlEscape(this.view.options.dataModal) + '"' : '') +
                (skinCss ? ' style="' + skinCss + '"' : '') +
                '>' +
                '<div class="fc-content">' +
                (timeText ? '<div class="fc-time"' +
                    ' data-start="' + htmlEscape(startTimeText) + '"' +
                    ' data-full="' + htmlEscape(fullTimeText) + '"' +
                    '>' +
                    '<span>' + htmlEscape(timeText) + '</span>' +
                    '</div>' : '') +
                (event.title ? '<div class="fc-title">' +
                    (event.title) +
                    '</div>' : '') +
                (event.description ? '<div class="fc-description">' +
                    event.description +
                    '</div>' : '') + trainerHtml +
                (event.categoryName ? '<div class="fc-category" style="background-color:' + event.categoryColor + '">' +
                    htmlEscape(event.categoryName) +
                    '</div>' : '') +
                '</div>' +
                '<div class="fc-ribbon" style="border-color:' + event.categoryColor + '"></div>' +
                '<div class="fc-bg" style="background-image: url(' + event.backgroundImage + ')" />' +
                (isResizableFromEnd ? '<div class="fc-resizer fc-end-resizer" />' : '') +
                '<input type="hidden" value=\'' + JSON.stringify($modalInfo) + '\'/>'
                +
                '</a>';
        },
        updateSegVerticals: function (segs) {
            this.computeSegVerticals(segs);
            this.assignSegVerticals(segs);
        },
        computeSegVerticals: function (segs) {
            var i, seg;
            var mang = this.view.options.hideTimeRange.split(',');
            var _maxTime = this.maxTime.hours();
            if (_maxTime == 0) _maxTime = 24;
            var kq = _maxTime - mang.length;
            var kq_mili = kq * 60 * 60 * 1000;
            var height_of_row = $('.noo-class-schedule .fc-view .fc-time-grid tr:eq(1)').height();
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                seg.top = this.computeDateTop(seg.start, seg.start);
                seg.bottom = this.computeDateTop(seg.end, seg.start);
                if (mang[0] != '') {
                    for (var j = 0; j < mang.length; j++) {
                        if (mang[j] <= seg.start.hours()) {
                            seg.top = seg.top - height_of_row - 1;
                            seg.bottom = seg.bottom - height_of_row - 1;
                        }
                    }
                    var balance_bottom = seg.end.hours() * 60 * 60 * 1000 + seg.end.minutes() * 60 * 1000;
                    if (balance_bottom > kq_mili) {
                        var rest_bottom = ((balance_bottom - kq_mili) * height_of_row) / (60 * 60 * 1000);
                        seg.bottom = seg.bottom + rest_bottom;
                    }
                    var balance_top = seg.start.hours() * 60 * 60 * 1000 + seg.start.minutes() * 60 * 1000;
                    if (balance_top > kq_mili) {
                        var rest_top = ((balance_top - kq_mili) * height_of_row) / (60 * 60 * 1000);
                        seg.top = seg.top + rest_top;
                    }
                }
            }
        },
        assignSegVerticals: function (segs) {
            var i, seg;
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                seg.el.css(this.generateSegVerticalCss(seg));
            }
        },
        generateSegVerticalCss: function (seg) {
            return {top: seg.top, bottom: -seg.bottom};
        },
        updateFgSegCoords: function (segs) {
            this.computeSegVerticals(segs);
            this.computeFgSegHorizontals(segs);
            this.assignSegVerticals(segs);
            this.assignFgSegHorizontals(segs);
        },
        computeFgSegHorizontals: function (segs) {
            var levels;
            var level0;
            var i;
            this.sortEventSegs(segs);
            levels = buildSlotSegLevels(segs);
            computeForwardSlotSegs(levels);
            if ((level0 = levels[0])) {
                for (i = 0; i < level0.length; i++) {
                    computeSlotSegPressures(level0[i]);
                }
                for (i = 0; i < level0.length; i++) {
                    this.computeFgSegForwardBack(level0[i], 0, 0);
                }
            }
        },
        computeFgSegForwardBack: function (seg, seriesBackwardPressure, seriesBackwardCoord) {
            var forwardSegs = seg.forwardSegs;
            var i;
            if (seg.forwardCoord === undefined) {
                if (!forwardSegs.length) {
                    seg.forwardCoord = 1;
                } else {
                    this.sortForwardSegs(forwardSegs);
                    this.computeFgSegForwardBack(forwardSegs[0], seriesBackwardPressure + 1, seriesBackwardCoord);
                    seg.forwardCoord = forwardSegs[0].backwardCoord;
                }
                seg.backwardCoord = seg.forwardCoord -
                    (seg.forwardCoord - seriesBackwardCoord) / (seriesBackwardPressure + 1);
                for (i = 0; i < forwardSegs.length; i++) {
                    this.computeFgSegForwardBack(forwardSegs[i], 0, seg.forwardCoord);
                }
            }
        },
        sortForwardSegs: function (forwardSegs) {
            forwardSegs.sort(proxy(this, 'compareForwardSegs'));
        },
        compareForwardSegs: function (seg1, seg2) {
            return seg2.forwardPressure - seg1.forwardPressure || (seg1.backwardCoord || 0) - (seg2.backwardCoord || 0) || this.compareEventSegs(seg1, seg2);
        },
        assignFgSegHorizontals: function (segs) {
            var i, seg;
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                seg.el.css(this.generateFgSegHorizontalCss(seg));
                if (seg.bottom - seg.top < 30) {
                    seg.el.addClass('fc-short');
                }
            }
        },
        generateFgSegHorizontalCss: function (seg) {
            var shouldOverlap = this.view.opt('slotEventOverlap');
            var backwardCoord = seg.backwardCoord;
            var forwardCoord = seg.forwardCoord;
            var props = this.generateSegVerticalCss(seg);
            var left;
            var right;
            if (shouldOverlap) {
                forwardCoord = Math.min(1, backwardCoord + (forwardCoord - backwardCoord) * 2);
            }
            if (this.isRTL) {
                left = 1 - forwardCoord;
                right = backwardCoord;
            } else {
                left = backwardCoord;
                right = 1 - forwardCoord;
            }
            props.zIndex = seg.level + 1;
            props.left = left * 100 + '%';
            props.right = right * 100 + '%';
            if (shouldOverlap && seg.forwardPressure) {
                props[this.isRTL ? 'marginLeft' : 'marginRight'] = 10 * 2;
            }
            return props;
        }
    });

    function buildSlotSegLevels(segs) {
        var levels = [];
        var i, seg;
        var j;
        for (i = 0; i < segs.length; i++) {
            seg = segs[i];
            for (j = 0; j < levels.length; j++) {
                if (!computeSlotSegCollisions(seg, levels[j]).length) {
                    break;
                }
            }
            seg.level = j;
            (levels[j] || (levels[j] = [])).push(seg);
        }
        return levels;
    }

    function computeForwardSlotSegs(levels) {
        var i, level;
        var j, seg;
        var k;
        for (i = 0; i < levels.length; i++) {
            level = levels[i];
            for (j = 0; j < level.length; j++) {
                seg = level[j];
                seg.forwardSegs = [];
                for (k = i + 1; k < levels.length; k++) {
                    computeSlotSegCollisions(seg, levels[k], seg.forwardSegs);
                }
            }
        }
    }

    function computeSlotSegPressures(seg) {
        var forwardSegs = seg.forwardSegs;
        var forwardPressure = 0;
        var i, forwardSeg;
        if (seg.forwardPressure === undefined) {
            for (i = 0; i < forwardSegs.length; i++) {
                forwardSeg = forwardSegs[i];
                computeSlotSegPressures(forwardSeg);
                forwardPressure = Math.max(forwardPressure, 1 + forwardSeg.forwardPressure);
            }
            seg.forwardPressure = forwardPressure;
        }
    }

    function computeSlotSegCollisions(seg, otherSegs, results) {
        results = results || [];
        for (var i = 0; i < otherSegs.length; i++) {
            if (isSlotSegCollision(seg, otherSegs[i])) {
                results.push(otherSegs[i]);
            }
        }
        return results;
    }

    function isSlotSegCollision(seg1, seg2) {
        return seg1.bottom > seg2.top && seg1.top < seg2.bottom;
    };
    ;var View = FC.View = Class.extend(EmitterMixin, ListenerMixin, {
        type: null,
        name: null,
        title: null,
        calendar: null,
        options: null,
        el: null,
        displaying: null,
        isSkeletonRendered: false,
        isEventsRendered: false,
        start: null,
        end: null,
        intervalStart: null,
        intervalEnd: null,
        intervalDuration: null,
        intervalUnit: null,
        isRTL: false,
        isSelected: false,
        selectedEvent: null,
        eventOrderSpecs: null,
        widgetHeaderClass: null,
        widgetContentClass: null,
        highlightStateClass: null,
        nextDayThreshold: null,
        isHiddenDayHash: null,
        isNowIndicatorRendered: null,
        initialNowDate: null,
        initialNowQueriedMs: null,
        nowIndicatorTimeoutID: null,
        nowIndicatorIntervalID: null,
        constructor: function (calendar, type, options, intervalDuration) {
            this.calendar = calendar;
            this.type = this.name = type;
            this.options = options;
            this.intervalDuration = intervalDuration || moment.duration(1, 'day');
            this.nextDayThreshold = moment.duration(this.opt('nextDayThreshold'));
            this.initThemingProps();
            this.initHiddenDays();
            this.isRTL = this.opt('isRTL');
            this.eventOrderSpecs = parseFieldSpecs(this.opt('eventOrder'));
            this.initialize();
        },
        initialize: function () {
        },
        opt: function (name) {
            return this.options[name];
        },
        trigger: function (name, thisObj) {
            var calendar = this.calendar;
            return calendar.trigger.apply(calendar, [name, thisObj || this].concat(Array.prototype.slice.call(arguments, 2), [this]));
        },
        setDate: function (date) {
            this.setRange(this.computeRange(date));
        },
        setRange: function (range) {
            $.extend(this, range);
            this.updateTitle();
        },
        computeRange: function (date) {
            var intervalUnit = computeIntervalUnit(this.intervalDuration);
            var intervalStart = date.clone().startOf(intervalUnit);
            var intervalEnd = intervalStart.clone().add(this.intervalDuration);
            var start, end;
            if (/year|month|week|day/.test(intervalUnit)) {
                intervalStart.stripTime();
                intervalEnd.stripTime();
            } else {
                if (!intervalStart.hasTime()) {
                    intervalStart = this.calendar.time(0);
                }
                if (!intervalEnd.hasTime()) {
                    intervalEnd = this.calendar.time(0);
                }
            }
            start = intervalStart.clone();
            start = this.skipHiddenDays(start);
            end = intervalEnd.clone();
            end = this.skipHiddenDays(end, -1, true);
            return {
                intervalUnit: intervalUnit,
                intervalStart: intervalStart,
                intervalEnd: intervalEnd,
                start: start,
                end: end
            };
        },
        computePrevDate: function (date) {
            return this.massageCurrentDate(date.clone().startOf(this.intervalUnit).subtract(this.intervalDuration), -1);
        },
        computeNextDate: function (date) {
            return this.massageCurrentDate(date.clone().startOf(this.intervalUnit).add(this.intervalDuration));
        },
        massageCurrentDate: function (date, direction) {
            if (this.intervalDuration.as('days') <= 1) {
                if (this.isHiddenDay(date)) {
                    date = this.skipHiddenDays(date, direction);
                    date.startOf('day');
                }
            }
            return date;
        },
        updateTitle: function () {
            this.title = this.computeTitle();
        },
        computeTitle: function () {
            return this.formatRange({
                start: this.calendar.applyTimezone(this.intervalStart),
                end: this.calendar.applyTimezone(this.intervalEnd)
            }, this.opt('titleFormat') || this.computeTitleFormat(), this.opt('titleRangeSeparator'));
        },
        computeTitleFormat: function () {
            if (this.intervalUnit == 'year') {
                return 'YYYY';
            } else if (this.intervalUnit == 'month') {
                return this.opt('monthYearFormat');
            } else if (this.intervalDuration.as('days') > 1) {
                return 'll';
            } else {
                return 'LL';
            }
        },
        formatRange: function (range, formatStr, separator) {
            var end = range.end;
            if (!end.hasTime()) {
                end = end.clone().subtract(1);
            }
            return formatRange(range.start, end, formatStr, separator, this.opt('isRTL'));
        },
        setElement: function (el) {
            this.el = el;
            this.bindGlobalHandlers();
        },
        removeElement: function () {
            this.clear();
            if (this.isSkeletonRendered) {
                this.unrenderSkeleton();
                this.isSkeletonRendered = false;
            }
            this.unbindGlobalHandlers();
            this.el.remove();
        },
        display: function (date) {
            var _this = this;
            var scrollState = null;
            if (this.displaying) {
                scrollState = this.queryScroll();
            }
            this.calendar.freezeContentHeight();
            return syncThen(this.clear(), function () {
                return (_this.displaying = syncThen(_this.displayView(date), function () {
                    _this.forceScroll(_this.computeInitialScroll(scrollState));
                    _this.calendar.unfreezeContentHeight();
                    _this.triggerRender();
                }));
            });
        },
        clear: function () {
            var _this = this;
            var displaying = this.displaying;
            if (displaying) {
                return syncThen(displaying, function () {
                    _this.displaying = null;
                    _this.clearEvents();
                    return _this.clearView();
                });
            } else {
                return $.when();
            }
        },
        displayView: function (date) {
            if (!this.isSkeletonRendered) {
                this.renderSkeleton();
                this.isSkeletonRendered = true;
            }
            if (date) {
                this.setDate(date);
            }
            if (this.render) {
                this.render();
            }
            this.renderDates();
            this.updateSize();
            this.renderBusinessHours();
            this.startNowIndicator();
        },
        clearView: function () {
            this.unselect();
            this.stopNowIndicator();
            this.triggerUnrender();
            this.unrenderBusinessHours();
            this.unrenderDates();
            if (this.destroy) {
                this.destroy();
            }
        },
        renderSkeleton: function () {
        },
        unrenderSkeleton: function () {
        },
        renderDates: function () {
        },
        unrenderDates: function () {
        },
        triggerRender: function () {
            this.trigger('viewRender', this, this, this.el);
        },
        triggerUnrender: function () {
            this.trigger('viewDestroy', this, this, this.el);
        },
        bindGlobalHandlers: function () {
            this.listenTo($(document), 'mousedown', this.handleDocumentMousedown);
            this.listenTo($(document), 'touchstart', this.processUnselect);
        },
        unbindGlobalHandlers: function () {
            this.stopListeningTo($(document));
        },
        initThemingProps: function () {
            var tm = this.opt('theme') ? 'ui' : 'fc';
            this.widgetHeaderClass = tm + '-widget-header';
            this.widgetContentClass = tm + '-widget-content';
            this.highlightStateClass = tm + '-state-highlight';
        },
        renderBusinessHours: function () {
        },
        unrenderBusinessHours: function () {
        },
        startNowIndicator: function () {
            var _this = this;
            var unit;
            var update;
            var delay;
            if (this.opt('nowIndicator')) {
                unit = this.getNowIndicatorUnit();
                if (unit) {
                    update = proxy(this, 'updateNowIndicator');
                    this.initialNowDate = this.calendar.getNow();
                    this.initialNowQueriedMs = +new Date();
                    this.renderNowIndicator(this.initialNowDate);
                    this.isNowIndicatorRendered = true;
                    delay = this.initialNowDate.clone().startOf(unit).add(1, unit) - this.initialNowDate;
                    this.nowIndicatorTimeoutID = setTimeout(function () {
                        _this.nowIndicatorTimeoutID = null;
                        update();
                        delay = +moment.duration(1, unit);
                        delay = Math.max(100, delay);
                        _this.nowIndicatorIntervalID = setInterval(update, delay);
                    }, delay);
                }
            }
        },
        updateNowIndicator: function () {
            if (this.isNowIndicatorRendered) {
                this.unrenderNowIndicator();
                this.renderNowIndicator(this.initialNowDate.clone().add(new Date() - this.initialNowQueriedMs));
            }
        },
        stopNowIndicator: function () {
            if (this.isNowIndicatorRendered) {
                if (this.nowIndicatorTimeoutID) {
                    clearTimeout(this.nowIndicatorTimeoutID);
                    this.nowIndicatorTimeoutID = null;
                }
                if (this.nowIndicatorIntervalID) {
                    clearTimeout(this.nowIndicatorIntervalID);
                    this.nowIndicatorIntervalID = null;
                }
                this.unrenderNowIndicator();
                this.isNowIndicatorRendered = false;
            }
        },
        getNowIndicatorUnit: function () {
        },
        renderNowIndicator: function (date) {
        },
        unrenderNowIndicator: function () {
        },
        updateSize: function (isResize) {
            var scrollState;
            if (isResize) {
                scrollState = this.queryScroll();
            }
            this.updateHeight(isResize);
            this.updateWidth(isResize);
            this.updateNowIndicator();
            if (isResize) {
                this.setScroll(scrollState);
            }
        },
        updateWidth: function (isResize) {
        },
        updateHeight: function (isResize) {
            var calendar = this.calendar;
            this.setHeight(calendar.getSuggestedViewHeight(), calendar.isHeightAuto());
        },
        setHeight: function (height, isAuto) {
        },
        computeInitialScroll: function (previousScrollState) {
            return 0;
        },
        queryScroll: function () {
        },
        setScroll: function (scrollState) {
        },
        forceScroll: function (scrollState) {
            var _this = this;
            this.setScroll(scrollState);
            setTimeout(function () {
                _this.setScroll(scrollState);
            }, 0);
        },
        displayEvents: function (events) {
            var scrollState = this.queryScroll();
            this.clearEvents();
            this.renderEvents(events);
            this.isEventsRendered = true;
            this.setScroll(scrollState);
            this.triggerEventRender();
        },
        clearEvents: function () {
            var scrollState;
            if (this.isEventsRendered) {
                scrollState = this.queryScroll();
                this.triggerEventUnrender();
                if (this.destroyEvents) {
                    this.destroyEvents();
                }
                this.unrenderEvents();
                this.setScroll(scrollState);
                this.isEventsRendered = false;
            }
        },
        renderEvents: function (events) {
        },
        unrenderEvents: function () {
        },
        triggerEventRender: function () {
            this.renderedEventSegEach(function (seg) {
                this.trigger('eventAfterRender', seg.event, seg.event, seg.el);
            });
            this.trigger('eventAfterAllRender');
        },
        triggerEventUnrender: function () {
            this.renderedEventSegEach(function (seg) {
                this.trigger('eventDestroy', seg.event, seg.event, seg.el);
            });
        },
        resolveEventEl: function (event, el) {
            var custom = this.trigger('eventRender', event, event, el);
            if (custom === false) {
                el = null;
            } else if (custom && custom !== true) {
                el = $(custom);
            }
            return el;
        },
        showEvent: function (event) {
            this.renderedEventSegEach(function (seg) {
                seg.el.css('visibility', '');
            }, event);
        },
        hideEvent: function (event) {
            this.renderedEventSegEach(function (seg) {
                seg.el.css('visibility', 'hidden');
            }, event);
        },
        renderedEventSegEach: function (func, event) {
            var segs = this.getEventSegs();
            var i;
            for (i = 0; i < segs.length; i++) {
                if (!event || segs[i].event._id === event._id) {
                    if (segs[i].el) {
                        func.call(this, segs[i]);
                    }
                }
            }
        },
        getEventSegs: function () {
            return [];
        },
        isEventDraggable: function (event) {
            var source = event.source || {};
            return firstDefined(event.startEditable, source.startEditable, this.opt('eventStartEditable'), event.editable, source.editable, this.opt('editable'));
        },
        reportEventDrop: function (event, dropLocation, largeUnit, el, ev) {
            var calendar = this.calendar;
            var mutateResult = calendar.mutateEvent(event, dropLocation, largeUnit);
            var undoFunc = function () {
                mutateResult.undo();
                calendar.reportEventChange();
            };
            this.triggerEventDrop(event, mutateResult.dateDelta, undoFunc, el, ev);
            calendar.reportEventChange();
        },
        triggerEventDrop: function (event, dateDelta, undoFunc, el, ev) {
            this.trigger('eventDrop', el[0], event, dateDelta, undoFunc, ev, {});
        },
        reportExternalDrop: function (meta, dropLocation, el, ev, ui) {
            var eventProps = meta.eventProps;
            var eventInput;
            var event;
            if (eventProps) {
                eventInput = $.extend({}, eventProps, dropLocation);
                event = this.calendar.renderEvent(eventInput, meta.stick)[0];
            }
            this.triggerExternalDrop(event, dropLocation, el, ev, ui);
        },
        triggerExternalDrop: function (event, dropLocation, el, ev, ui) {
            this.trigger('drop', el[0], dropLocation.start, ev, ui);
            if (event) {
                this.trigger('eventReceive', null, event);
            }
        },
        renderDrag: function (dropLocation, seg) {
        },
        unrenderDrag: function () {
        },
        isEventResizableFromStart: function (event) {
            return this.opt('eventResizableFromStart') && this.isEventResizable(event);
        },
        isEventResizableFromEnd: function (event) {
            return this.isEventResizable(event);
        },
        isEventResizable: function (event) {
            var source = event.source || {};
            return firstDefined(event.durationEditable, source.durationEditable, this.opt('eventDurationEditable'), event.editable, source.editable, this.opt('editable'));
        },
        reportEventResize: function (event, resizeLocation, largeUnit, el, ev) {
            var calendar = this.calendar;
            var mutateResult = calendar.mutateEvent(event, resizeLocation, largeUnit);
            var undoFunc = function () {
                mutateResult.undo();
                calendar.reportEventChange();
            };
            this.triggerEventResize(event, mutateResult.durationDelta, undoFunc, el, ev);
            calendar.reportEventChange();
        },
        triggerEventResize: function (event, durationDelta, undoFunc, el, ev) {
            this.trigger('eventResize', el[0], event, durationDelta, undoFunc, ev, {});
        },
        select: function (span, ev) {
            this.unselect(ev);
            this.renderSelection(span);
            this.reportSelection(span, ev);
        },
        renderSelection: function (span) {
        },
        reportSelection: function (span, ev) {
            this.isSelected = true;
            this.triggerSelect(span, ev);
        },
        triggerSelect: function (span, ev) {
            this.trigger('select', null, this.calendar.applyTimezone(span.start), this.calendar.applyTimezone(span.end), ev);
        },
        unselect: function (ev) {
            if (this.isSelected) {
                this.isSelected = false;
                if (this.destroySelection) {
                    this.destroySelection();
                }
                this.unrenderSelection();
                this.trigger('unselect', null, ev);
            }
        },
        unrenderSelection: function () {
        },
        selectEvent: function (event) {
            if (!this.selectedEvent || this.selectedEvent !== event) {
                this.unselectEvent();
                this.renderedEventSegEach(function (seg) {
                    seg.el.addClass('fc-selected');
                }, event);
                this.selectedEvent = event;
            }
        },
        unselectEvent: function () {
            if (this.selectedEvent) {
                this.renderedEventSegEach(function (seg) {
                    seg.el.removeClass('fc-selected');
                }, this.selectedEvent);
                this.selectedEvent = null;
            }
        },
        isEventSelected: function (event) {
            return this.selectedEvent && this.selectedEvent._id === event._id;
        },
        handleDocumentMousedown: function (ev) {
            if (isPrimaryMouseButton(ev)) {
                this.processUnselect(ev);
            }
        },
        processUnselect: function (ev) {
            this.processRangeUnselect(ev);
            this.processEventUnselect(ev);
        },
        processRangeUnselect: function (ev) {
            var ignore;
            if (this.isSelected && this.opt('unselectAuto')) {
                ignore = this.opt('unselectCancel');
                if (!ignore || !$(ev.target).closest(ignore).length) {
                    this.unselect(ev);
                }
            }
        },
        processEventUnselect: function (ev) {
            if (this.selectedEvent) {
                if (!$(ev.target).closest('.fc-selected').length) {
                    this.unselectEvent();
                }
            }
        },
        triggerDayClick: function (span, dayEl, ev) {
            this.trigger('dayClick', dayEl, this.calendar.applyTimezone(span.start), ev);
        },
        initHiddenDays: function () {
            var hiddenDays = this.opt('hiddenDays') || [];
            var isHiddenDayHash = [];
            var dayCnt = 0;
            var i;
            if (this.opt('weekends') === 'false') {
                hiddenDays.push(0, 6);
            } else {
                if (this.opt('weekends') === 'sat') {
                    hiddenDays.push(0);
                } else {
                    if (this.opt('weekends') === 'sun') {
                        hiddenDays.push(6);
                    }
                }
            }
            for (i = 0; i < 7; i++) {
                if (!(isHiddenDayHash[i] = $.inArray(i, hiddenDays) !== -1)) {
                    dayCnt++;
                }
            }
            if (!dayCnt) {
                throw 'invalid hiddenDays';
            }
            this.isHiddenDayHash = isHiddenDayHash;
        },
        isHiddenDay: function (day) {
            if (moment.isMoment(day)) {
                day = day.day();
            }
            return this.isHiddenDayHash[day];
        },
        skipHiddenDays: function (date, inc, isExclusive) {
            var out = date.clone();
            inc = inc || 1;
            while (this.isHiddenDayHash[(out.day() + (isExclusive ? inc : 0) + 7) % 7]) {
                out.add(inc, 'days');
            }
            return out;
        },
        computeDayRange: function (range) {
            var startDay = range.start.clone().stripTime();
            var end = range.end;
            var endDay = null;
            var endTimeMS;
            if (end) {
                endDay = end.clone().stripTime();
                endTimeMS = +end.time();
                if (endTimeMS && endTimeMS >= this.nextDayThreshold) {
                    endDay.add(1, 'days');
                }
            }
            if (!end || endDay <= startDay) {
                endDay = startDay.clone().add(1, 'days');
            }
            return {start: startDay, end: endDay};
        },
        isMultiDayEvent: function (event) {
            var range = this.computeDayRange(event);
            return range.end.diff(range.start, 'days') > 1;
        }
    });
    ;
    ;var Scroller = FC.Scroller = Class.extend({
        el: null, scrollEl: null, overflowX: null, overflowY: null, constructor: function (options) {
            options = options || {};
            this.overflowX = options.overflowX || options.overflow || 'auto';
            this.overflowY = options.overflowY || options.overflow || 'auto';
        }, render: function () {
            this.el = this.renderEl();
            this.applyOverflow();
        }, renderEl: function () {
            return (this.scrollEl = $('<div class="fc-scroller"></div>'));
        }, clear: function () {
            this.setHeight('auto');
            this.applyOverflow();
        }, destroy: function () {
            this.el.remove();
        }, applyOverflow: function () {
            this.scrollEl.css({'overflow-x': this.overflowX, 'overflow-y': this.overflowY});
        }, lockOverflow: function (scrollbarWidths) {
            var overflowX = this.overflowX;
            var overflowY = this.overflowY;
            scrollbarWidths = scrollbarWidths || this.getScrollbarWidths();
            if (overflowX === 'auto') {
                overflowX = (scrollbarWidths.top || scrollbarWidths.bottom || this.scrollEl[0].scrollWidth - 1 > this.scrollEl[0].clientWidth) ? 'scroll' : 'hidden';
            }
            if (overflowY === 'auto') {
                overflowY = (scrollbarWidths.left || scrollbarWidths.right || this.scrollEl[0].scrollHeight - 1 > this.scrollEl[0].clientHeight) ? 'scroll' : 'hidden';
            }
            this.scrollEl.css({'overflow-x': overflowX, 'overflow-y': overflowY});
        }, setHeight: function (height) {
            this.scrollEl.height(height);
        }, getScrollTop: function () {
            return this.scrollEl.scrollTop();
        }, setScrollTop: function (top) {
            this.scrollEl.scrollTop(top);
        }, getClientWidth: function () {
            return this.scrollEl[0].clientWidth;
        }, getClientHeight: function () {
            return this.scrollEl[0].clientHeight;
        }, getScrollbarWidths: function () {
            return getScrollbarWidths(this.scrollEl);
        }
    });
    ;
    ;var Calendar = FC.Calendar = Class.extend({
        dirDefaults: null,
        langDefaults: null,
        overrides: null,
        options: null,
        viewSpecCache: null,
        view: null,
        header: null,
        loadingLevel: 0,
        constructor: Calendar_constructor,
        initialize: function () {
        },
        initOptions: function (overrides) {
            var lang, langDefaults;
            var isRTL, dirDefaults;
            overrides = massageOverrides(overrides);
            lang = overrides.lang;
            langDefaults = langOptionHash[lang];
            if (!langDefaults) {
                lang = Calendar.defaults.lang;
                langDefaults = langOptionHash[lang] || {};
            }
            isRTL = firstDefined(overrides.isRTL, langDefaults.isRTL, Calendar.defaults.isRTL);
            dirDefaults = isRTL ? Calendar.rtlDefaults : {};
            this.dirDefaults = dirDefaults;
            this.langDefaults = langDefaults;
            this.overrides = overrides;
            this.options = mergeOptions([Calendar.defaults, dirDefaults, langDefaults, overrides]);
            populateInstanceComputableOptions(this.options);
            this.viewSpecCache = {};
        },
        getViewSpec: function (viewType) {
            var cache = this.viewSpecCache;
            return cache[viewType] || (cache[viewType] = this.buildViewSpec(viewType));
        },
        getUnitViewSpec: function (unit) {
            var viewTypes;
            var i;
            var spec;
            if ($.inArray(unit, intervalUnits) != -1) {
                viewTypes = this.header.getViewsWithButtons();
                $.each(FC.views, function (viewType) {
                    viewTypes.push(viewType);
                });
                for (i = 0; i < viewTypes.length; i++) {
                    spec = this.getViewSpec(viewTypes[i]);
                    if (spec) {
                        if (spec.singleUnit == unit) {
                            return spec;
                        }
                    }
                }
            }
        },
        buildViewSpec: function (requestedViewType) {
            var viewOverrides = this.overrides.views || {};
            var specChain = [];
            var defaultsChain = [];
            var overridesChain = [];
            var viewType = requestedViewType;
            var spec;
            var overrides;
            var duration;
            var unit;
            while (viewType) {
                spec = fcViews[viewType];
                overrides = viewOverrides[viewType];
                viewType = null;
                if (typeof spec === 'function') {
                    spec = {'class': spec};
                }
                if (spec) {
                    specChain.unshift(spec);
                    defaultsChain.unshift(spec.defaults || {});
                    duration = duration || spec.duration;
                    viewType = viewType || spec.type;
                }
                if (overrides) {
                    overridesChain.unshift(overrides);
                    duration = duration || overrides.duration;
                    viewType = viewType || overrides.type;
                }
            }
            spec = mergeProps(specChain);
            spec.type = requestedViewType;
            if (!spec['class']) {
                return false;
            }
            if (duration) {
                duration = moment.duration(duration);
                if (duration.valueOf()) {
                    spec.duration = duration;
                    unit = computeIntervalUnit(duration);
                    if (duration.as(unit) === 1) {
                        spec.singleUnit = unit;
                        overridesChain.unshift(viewOverrides[unit] || {});
                    }
                }
            }
            spec.defaults = mergeOptions(defaultsChain);
            spec.overrides = mergeOptions(overridesChain);
            this.buildViewSpecOptions(spec);
            this.buildViewSpecButtonText(spec, requestedViewType);
            return spec;
        },
        buildViewSpecOptions: function (spec) {
            spec.options = mergeOptions([Calendar.defaults, spec.defaults, this.dirDefaults, this.langDefaults, this.overrides, spec.overrides]);
            populateInstanceComputableOptions(spec.options);
        },
        buildViewSpecButtonText: function (spec, requestedViewType) {
            function queryButtonText(options) {
                var buttonText = options.buttonText || {};
                return buttonText[requestedViewType] || (spec.singleUnit ? buttonText[spec.singleUnit] : null);
            }

            spec.buttonTextOverride = queryButtonText(this.overrides) || spec.overrides.buttonText;
            spec.buttonTextDefault = queryButtonText(this.langDefaults) || queryButtonText(this.dirDefaults) || spec.defaults.buttonText || queryButtonText(Calendar.defaults) || (spec.duration ? this.humanizeDuration(spec.duration) : null) || requestedViewType;
        },
        instantiateView: function (viewType) {
            var spec = this.getViewSpec(viewType);
            return new spec['class'](this, viewType, spec.options, spec.duration);
        },
        isValidViewType: function (viewType) {
            return Boolean(this.getViewSpec(viewType));
        },
        pushLoading: function () {
            if (!(this.loadingLevel++)) {
                this.trigger('loading', null, true, this.view);
            }
        },
        popLoading: function () {
            if (!(--this.loadingLevel)) {
                this.trigger('loading', null, false, this.view);
            }
        },
        buildSelectSpan: function (zonedStartInput, zonedEndInput) {
            var start = this.moment(zonedStartInput).stripZone();
            var end;
            if (zonedEndInput) {
                end = this.moment(zonedEndInput).stripZone();
            } else if (start.hasTime()) {
                end = start.clone().add(this.defaultTimedEventDuration);
            } else {
                end = start.clone().add(this.defaultAllDayEventDuration);
            }
            return {start: start, end: end};
        }
    });
    Calendar.mixin(EmitterMixin);

    function Calendar_constructor(element, overrides) {
        var t = this;
        t.initOptions(overrides || {});
        var options = this.options;
        t.render = render;
        t.destroy = destroy;
        t.refetchEvents = refetchEvents;
        t.refetchEventSources = refetchEventSources;
        t.reportEvents = reportEvents;
        t.reportEventChange = reportEventChange;
        t.rerenderEvents = renderEvents;
        t.changeView = renderView;
        t.select = select;
        t.unselect = unselect;
        t.prev = prev;
        t.next = next;
        t.prevYear = prevYear;
        t.nextYear = nextYear;
        t.today = today;
        t.gotoDate = gotoDate;
        t.incrementDate = incrementDate;
        t.zoomTo = zoomTo;
        t.getDate = getDate;
        t.getCalendar = getCalendar;
        t.getView = getView;
        t.option = option;
        t.trigger = trigger;
        var localeData = createObject(getMomentLocaleData(options.lang));
        if (options.monthNames) {
            localeData._months = options.monthNames;
        }
        if (options.monthNamesShort) {
            localeData._monthsShort = options.monthNamesShort;
        }
        if (options.dayNames) {
            localeData._weekdays = options.dayNames;
        }
        if (options.dayNamesShort) {
            localeData._weekdaysShort = options.dayNamesShort;
        }
        if (options.firstDay != null) {
            var _week = createObject(localeData._week);
            _week.dow = options.firstDay;
            localeData._week = _week;
        }
        localeData._fullCalendar_weekCalc = (function (weekCalc) {
            if (typeof weekCalc === 'function') {
                return weekCalc;
            } else if (weekCalc === 'local') {
                return weekCalc;
            } else if (weekCalc === 'iso' || weekCalc === 'ISO') {
                return 'ISO';
            }
        })(options.weekNumberCalculation);
        t.defaultAllDayEventDuration = moment.duration(options.defaultAllDayEventDuration);
        t.defaultTimedEventDuration = moment.duration(options.defaultTimedEventDuration);
        t.moment = function () {
            var mom;
            if (options.timezone === 'local') {
                mom = FC.moment.apply(null, arguments);
                if (mom.hasTime()) {
                    mom.local();
                }
            } else if (options.timezone === 'UTC') {
                mom = FC.moment.utc.apply(null, arguments);
            } else {
                mom = FC.moment.parseZone.apply(null, arguments);
            }
            if ('_locale' in mom) {
                mom._locale = localeData;
            } else {
                mom._lang = localeData;
            }
            return mom;
        };
        t.getIsAmbigTimezone = function () {
            return options.timezone !== 'local' && options.timezone !== 'UTC';
        };
        t.applyTimezone = function (date) {
            if (!date.hasTime()) {
                return date.clone();
            }
            var zonedDate = t.moment(date.toArray());
            var timeAdjust = date.time() - zonedDate.time();
            var adjustedZonedDate;
            if (timeAdjust) {
                adjustedZonedDate = zonedDate.clone().add(timeAdjust);
                if (date.time() - adjustedZonedDate.time() === 0) {
                    zonedDate = adjustedZonedDate;
                }
            }
            return zonedDate;
        };
        t.getNow = function () {
            var now = options.now;
            if (typeof now === 'function') {
                now = now();
            }
            return t.moment(now).stripZone();
        };
        t.getEventEnd = function (event) {
            if (event.end) {
                return event.end.clone();
            } else {
                return t.getDefaultEventEnd(event.allDay, event.start);
            }
        };
        t.getDefaultEventEnd = function (allDay, zonedStart) {
            var end = zonedStart.clone();
            if (allDay) {
                end.stripTime().add(t.defaultAllDayEventDuration);
            } else {
                end.add(t.defaultTimedEventDuration);
            }
            if (t.getIsAmbigTimezone()) {
                end.stripZone();
            }
            return end;
        };
        t.humanizeDuration = function (duration) {
            return (duration.locale || duration.lang).call(duration, options.lang).humanize();
        };
        EventManager.call(t, options);
        var isFetchNeeded = t.isFetchNeeded;
        var fetchEvents = t.fetchEvents;
        var fetchEventSources = t.fetchEventSources;
        var _element = element[0];
        var header;
        var headerElement;
        var content;
        var tm;
        var currentView;
        var viewsByType = {};
        var suggestedViewHeight;
        var windowResizeProxy;
        var ignoreWindowResize = 0;
        var events = [];
        var date;
        if (options.defaultDate != null) {
            date = t.moment(options.defaultDate).stripZone();
        } else {
            date = t.getNow();
        }

        function render() {
            if (!content) {
                initialRender();
            } else if (elementVisible()) {
                calcSize();
                renderView();
            }
        }

        function initialRender() {
            tm = options.theme ? 'ui' : 'fc';
            element.addClass('fc');
            if (options.isRTL) {
                element.addClass('fc-rtl');
            } else {
                element.addClass('fc-ltr');
            }
            if (options.theme) {
                element.addClass('ui-widget');
            } else {
                element.addClass('fc-unthemed');
            }
            content = $("<div class='fc-view-container'/>").prependTo(element);
            header = t.header = new Header(t, options);
            headerElement = header.render();
            if (headerElement) {
                element.prepend(headerElement);
            }
            renderView(options.defaultView);
            if (options.handleWindowResize) {
                windowResizeProxy = debounce(windowResize, options.windowResizeDelay);
                $(window).resize(windowResizeProxy);
            }
        }

        function destroy() {
            if (currentView) {
                currentView.removeElement();
            }
            header.removeElement();
            content.remove();
            element.removeClass('fc fc-ltr fc-rtl fc-unthemed ui-widget');
            if (windowResizeProxy) {
                $(window).unbind('resize', windowResizeProxy);
            }
        }

        function elementVisible() {
            return element.is(':visible');
        }

        function renderView(viewType) {
            ignoreWindowResize++;
            if (currentView && viewType && currentView.type !== viewType) {
                header.deactivateButton(currentView.type);
                freezeContentHeight();
                currentView.removeElement();
                currentView = t.view = null;
            }
            if (!currentView && viewType) {
                currentView = t.view = viewsByType[viewType] || (viewsByType[viewType] = t.instantiateView(viewType));
                currentView.setElement($("<div class='fc-view fc-" + viewType + "-view' />").appendTo(content));
                header.activateButton(viewType);
            }
            if (currentView) {
                date = currentView.massageCurrentDate(date);
                if (!currentView.displaying || !date.isWithin(currentView.intervalStart, currentView.intervalEnd)) {
                    if (elementVisible()) {
                        currentView.display(date);
                        unfreezeContentHeight();
                        updateHeaderTitle();
                        updateTodayButton();
                        getAndRenderEvents();
                    }
                }
            }
            unfreezeContentHeight();
            ignoreWindowResize--;
        }

        t.getSuggestedViewHeight = function () {
            if (suggestedViewHeight === undefined) {
                calcSize();
            }
            return suggestedViewHeight;
        };
        t.isHeightAuto = function () {
            return options.contentHeight === 'auto' || options.height === 'auto';
        };

        function updateSize(shouldRecalc) {
            if (elementVisible()) {
                if (shouldRecalc) {
                    _calcSize();
                }
                ignoreWindowResize++;
                currentView.updateSize(true);
                ignoreWindowResize--;
                return true;
            }
        }

        function calcSize() {
            if (elementVisible()) {
                _calcSize();
            }
        }

        function _calcSize() {
            if (typeof options.contentHeight === 'number') {
                suggestedViewHeight = options.contentHeight;
            } else if (typeof options.height === 'number') {
                suggestedViewHeight = options.height - (headerElement ? headerElement.outerHeight(true) : 0);
            } else {
                suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
            }
        }

        function windowResize(ev) {
            if (!ignoreWindowResize && ev.target === window && currentView.start) {
                if (updateSize(true)) {
                    currentView.trigger('windowResize', _element);
                }
            }
        }

        function refetchEvents() {
            fetchAndRenderEvents();
        }

        function refetchEventSources(matchInputs) {
            fetchEventSources(t.getEventSourcesByMatchArray(matchInputs));
        }

        function renderEvents() {
            if (elementVisible()) {
                freezeContentHeight();
                currentView.displayEvents(events);
                unfreezeContentHeight();
            }
        }

        function getAndRenderEvents() {
            if (!options.lazyFetching || isFetchNeeded(currentView.start, currentView.end)) {
                fetchAndRenderEvents();
            } else {
                renderEvents();
            }
        }

        function fetchAndRenderEvents() {
            fetchEvents(currentView.start, currentView.end);
        }

        function reportEvents(_events) {
            events = _events;
            renderEvents();
        }

        function reportEventChange() {
            renderEvents();
        }

        function updateHeaderTitle() {
            header.updateTitle(currentView.title);
        }

        function updateTodayButton() {
            var now = t.getNow();
            if (now.isWithin(currentView.intervalStart, currentView.intervalEnd)) {
                header.disableButton('today');
            } else {
                header.enableButton('today');
            }
        }

        function select(zonedStartInput, zonedEndInput) {
            currentView.select(t.buildSelectSpan.apply(t, arguments));
        }

        function unselect() {
            if (currentView) {
                currentView.unselect();
            }
        }

        function prev() {
            date = currentView.computePrevDate(date);
            renderView();
        }

        function next() {
            date = currentView.computeNextDate(date);
            renderView();
        }

        function prevYear() {
            date.add(-1, 'years');
            renderView();
        }

        function nextYear() {
            date.add(1, 'years');
            renderView();
        }

        function today() {
            date = t.getNow();
            renderView();
        }

        function gotoDate(zonedDateInput) {
            date = t.moment(zonedDateInput).stripZone();
            renderView();
        }

        function incrementDate(delta) {
            date.add(moment.duration(delta));
            renderView();
        }

        function zoomTo(newDate, viewType) {
            var spec;
            viewType = viewType || 'day';
            spec = t.getViewSpec(viewType) || t.getUnitViewSpec(viewType);
            date = newDate.clone();
            renderView(spec ? spec.type : null);
        }

        function getDate() {
            return t.applyTimezone(date);
        }

        t.freezeContentHeight = freezeContentHeight;
        t.unfreezeContentHeight = unfreezeContentHeight;

        function freezeContentHeight() {
            content.css({width: '100%', height: content.height(), overflow: 'hidden'});
        }

        function unfreezeContentHeight() {
            content.css({width: '', height: '', overflow: ''});
        }

        function getCalendar() {
            return t;
        }

        function getView() {
            return currentView;
        }

        function option(name, value) {
            if (value === undefined) {
                return options[name];
            }
            if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
                options[name] = value;
                updateSize(true);
            }
        }

        function trigger(name, thisObj) {
            var args = Array.prototype.slice.call(arguments, 2);
            thisObj = thisObj || _element;
            this.triggerWith(name, thisObj, args);
            if (options[name]) {
                return options[name].apply(thisObj, args);
            }
        }

        t.initialize();
    };
    ;Calendar.defaults = {
        titleRangeSeparator: ' \u2013 ',
        monthYearFormat: 'MMMM YYYY',
        defaultTimedEventDuration: '02:00:00',
        defaultAllDayEventDuration: {days: 1},
        forceEventDuration: false,
        nextDayThreshold: '09:00:00',
        defaultView: 'month',
        aspectRatio: 1.35,
        header: {left: 'title', center: '', right: 'today prev,next'},
        weekends: true,
        weekNumbers: false,
        weekNumberTitle: 'W',
        weekNumberCalculation: 'local',
        scrollTime: '06:00:00',
        lazyFetching: true,
        startParam: 'start',
        endParam: 'end',
        timezoneParam: 'timezone',
        timezone: false,
        isRTL: false,
        buttonText: {
            prev: "prev",
            next: "next",
            prevYear: "prev year",
            nextYear: "next year",
            year: 'year',
            today: 'today',
            month: 'month',
            week: 'week',
            day: 'day'
        },
        buttonIcons: {
            prev: 'left-single-arrow',
            next: 'right-single-arrow',
            prevYear: 'left-double-arrow',
            nextYear: 'right-double-arrow'
        },
        theme: false,
        themeButtonIcons: {
            prev: 'circle-triangle-w',
            next: 'circle-triangle-e',
            prevYear: 'seek-prev',
            nextYear: 'seek-next'
        },
        dragOpacity: .75,
        dragRevertDuration: 500,
        dragScroll: true,
        unselectAuto: true,
        dropAccept: '*',
        eventOrder: 'title',
        eventLimit: false,
        eventLimitText: 'more',
        eventLimitClick: 'popover',
        dayPopoverFormat: 'LL',
        handleWindowResize: true,
        windowResizeDelay: 200,
        longPressDelay: 1000
    };
    Calendar.englishDefaults = {dayPopoverFormat: 'dddd, MMMM D'};
    Calendar.rtlDefaults = {
        header: {left: 'next,prev today', center: '', right: 'title'},
        buttonIcons: {
            prev: 'right-single-arrow',
            next: 'left-single-arrow',
            prevYear: 'right-double-arrow',
            nextYear: 'left-double-arrow'
        },
        themeButtonIcons: {
            prev: 'circle-triangle-e',
            next: 'circle-triangle-w',
            nextYear: 'seek-prev',
            prevYear: 'seek-next'
        }
    };
    ;
    ;var langOptionHash = FC.langs = {};
    FC.datepickerLang = function (langCode, dpLangCode, dpOptions) {
        var fcOptions = langOptionHash[langCode] || (langOptionHash[langCode] = {});
        fcOptions.isRTL = dpOptions.isRTL;
        fcOptions.weekNumberTitle = dpOptions.weekHeader;
        $.each(dpComputableOptions, function (name, func) {
            fcOptions[name] = func(dpOptions);
        });
        if ($.datepicker) {
            $.datepicker.regional[dpLangCode] = $.datepicker.regional[langCode] = dpOptions;
            $.datepicker.regional.en = $.datepicker.regional[''];
            $.datepicker.setDefaults(dpOptions);
        }
    };
    FC.lang = function (langCode, newFcOptions) {
        var fcOptions;
        var momOptions;
        fcOptions = langOptionHash[langCode] || (langOptionHash[langCode] = {});
        if (newFcOptions) {
            fcOptions = langOptionHash[langCode] = mergeOptions([fcOptions, newFcOptions]);
        }
        momOptions = getMomentLocaleData(langCode);
        $.each(momComputableOptions, function (name, func) {
            if (fcOptions[name] == null) {
                fcOptions[name] = func(momOptions, fcOptions);
            }
        });
        Calendar.defaults.lang = langCode;
    };
    var dpComputableOptions = {
        buttonText: function (dpOptions) {
            return {
                prev: stripHtmlEntities(dpOptions.prevText),
                next: stripHtmlEntities(dpOptions.nextText),
                today: stripHtmlEntities(dpOptions.currentText)
            };
        }, monthYearFormat: function (dpOptions) {
            return dpOptions.showMonthAfterYear ? 'YYYY[' + dpOptions.yearSuffix + '] MMMM' : 'MMMM YYYY[' + dpOptions.yearSuffix + ']';
        }
    };
    var momComputableOptions = {
        dayOfMonthFormat: function (momOptions, fcOptions) {
            var format = momOptions.longDateFormat('l');
            format = format.replace(/^Y+[^\w\s]*|[^\w\s]*Y+$/g, '');
            if (fcOptions.isRTL) {
                format += ' ddd';
            } else {
                format = 'ddd ' + format;
            }
            return format;
        }, mediumTimeFormat: function (momOptions) {
            return momOptions.longDateFormat('LT').replace(/\s*a$/i, 'a');
        }, smallTimeFormat: function (momOptions) {
            return momOptions.longDateFormat('LT').replace(':mm', '(:mm)').replace(/(\Wmm)$/, '($1)').replace(/\s*a$/i, 'a');
        }, extraSmallTimeFormat: function (momOptions) {
            return momOptions.longDateFormat('LT').replace(':mm', '(:mm)').replace(/(\Wmm)$/, '($1)').replace(/\s*a$/i, 't');
        }, hourFormat: function (momOptions) {
            return momOptions.longDateFormat('LT').replace(':mm', '').replace(/(\Wmm)$/, '').replace(/\s*a$/i, 'a');
        }, noMeridiemTimeFormat: function (momOptions) {
            return momOptions.longDateFormat('LT').replace(/\s*a$/i, '');
        }
    };
    var instanceComputableOptions = {
        smallDayDateFormat: function (options) {
            return options.isRTL ? 'D dd' : 'dd D';
        }, weekFormat: function (options) {
            return options.isRTL ? 'w[ ' + options.weekNumberTitle + ']' : '[' + options.weekNumberTitle + ' ]w';
        }, smallWeekFormat: function (options) {
            return options.isRTL ? 'w[' + options.weekNumberTitle + ']' : '[' + options.weekNumberTitle + ']w';
        }
    };

    function populateInstanceComputableOptions(options) {
        $.each(instanceComputableOptions, function (name, func) {
            if (options[name] == null) {
                options[name] = func(options);
            }
        });
    }

    function getMomentLocaleData(langCode) {
        var func = moment.localeData || moment.langData;
        return func.call(moment, langCode) || func.call(moment, 'en');
    }

    FC.lang('en', Calendar.englishDefaults);
    ;
    ;

    function Header(calendar, options) {
        var t = this;
        t.render = render;
        t.removeElement = removeElement;
        t.updateTitle = updateTitle;
        t.activateButton = activateButton;
        t.deactivateButton = deactivateButton;
        t.disableButton = disableButton;
        t.enableButton = enableButton;
        t.getViewsWithButtons = getViewsWithButtons;
        var el = $();
        var viewsWithButtons = [];
        var tm;

        function render() {
            var sections = options.header;
            tm = options.theme ? 'ui' : 'fc';
            if (sections) {
                el = $("<div class='fc-toolbar'/>").append(renderSection('left')).append(renderSection('right')).append(renderSection('center')).append('<div class="fc-clear"/>');
                return el;
            }
        }

        function removeElement() {
            el.remove();
            el = $();
        }

        function renderSection(position) {
            var sectionEl = $('<div class="fc-' + position + '"/>');
            var buttonStr = options.header[position];
            if (buttonStr) {
                $.each(buttonStr.split(' '), function (i) {
                    var groupChildren = $();
                    var isOnlyButtons = true;
                    var groupEl;
                    $.each(this.split(','), function (j, buttonName) {
                        var customButtonProps;
                        var viewSpec;
                        var buttonClick;
                        var overrideText;
                        var defaultText;
                        var themeIcon;
                        var normalIcon;
                        var innerHtml;
                        var classes;
                        var button;
                        if (buttonName == 'title') {
                            groupChildren = groupChildren.add($('<h2>&nbsp;</h2>'));
                            isOnlyButtons = false;
                        } else {
                            if ((customButtonProps = (calendar.options.customButtons || {})[buttonName])) {
                                buttonClick = function (ev) {
                                    if (customButtonProps.click) {
                                        customButtonProps.click.call(button[0], ev);
                                    }
                                };
                                overrideText = '';
                                defaultText = customButtonProps.text;
                            } else if ((viewSpec = calendar.getViewSpec(buttonName))) {
                                buttonClick = function () {
                                    calendar.changeView(buttonName);
                                };
                                viewsWithButtons.push(buttonName);
                                overrideText = viewSpec.buttonTextOverride;
                                defaultText = viewSpec.buttonTextDefault;
                            } else if (calendar[buttonName]) {
                                buttonClick = function () {
                                    calendar[buttonName]();
                                };
                                overrideText = (calendar.overrides.buttonText || {})[buttonName];
                                defaultText = options.buttonText[buttonName];
                            }
                            if (buttonClick) {
                                themeIcon = customButtonProps ? customButtonProps.themeIcon : options.themeButtonIcons[buttonName];
                                normalIcon = customButtonProps ? customButtonProps.icon : options.buttonIcons[buttonName];
                                if (overrideText) {
                                    innerHtml = htmlEscape(overrideText);
                                } else if (themeIcon && options.theme) {
                                    innerHtml = "<span class='ui-icon ui-icon-" + themeIcon + "'></span>";
                                } else if (normalIcon && !options.theme) {
                                    innerHtml = "<span class='fc-icon fc-icon-" + normalIcon + "'></span>";
                                } else {
                                    innerHtml = htmlEscape(defaultText);
                                }
                                classes = ['fc-' + buttonName + '-button', tm + '-button', tm + '-state-default'];
                                button = $('<button type="button" class="' + classes.join(' ') + '">' +
                                    innerHtml +
                                    '</button>').click(function (ev) {
                                    if (!button.hasClass(tm + '-state-disabled')) {
                                        buttonClick(ev);
                                        if (button.hasClass(tm + '-state-active') || button.hasClass(tm + '-state-disabled')) {
                                            button.removeClass(tm + '-state-hover');
                                        }
                                    }
                                }).mousedown(function () {
                                    button.not('.' + tm + '-state-active').not('.' + tm + '-state-disabled').addClass(tm + '-state-down');
                                }).mouseup(function () {
                                    button.removeClass(tm + '-state-down');
                                }).hover(function () {
                                    button.not('.' + tm + '-state-active').not('.' + tm + '-state-disabled').addClass(tm + '-state-hover');
                                }, function () {
                                    button.removeClass(tm + '-state-hover').removeClass(tm + '-state-down');
                                });
                                groupChildren = groupChildren.add(button);
                            }
                        }
                    });
                    if (isOnlyButtons) {
                        groupChildren.first().addClass(tm + '-corner-left').end().last().addClass(tm + '-corner-right').end();
                    }
                    if (groupChildren.length > 1) {
                        groupEl = $('<div/>');
                        if (isOnlyButtons) {
                            groupEl.addClass('fc-button-group');
                        }
                        groupEl.append(groupChildren);
                        sectionEl.append(groupEl);
                    } else {
                        sectionEl.append(groupChildren);
                    }
                });
            }
            return sectionEl;
        }

        function updateTitle(text) {
            el.find('h2').remove();
            el.find('.fc-center').append('<h2></h2>');
            el.find('h2').addClass('eff');
            el.find('h2').text(text);
        }

        function activateButton(buttonName) {
            el.find('.fc-' + buttonName + '-button').addClass(tm + '-state-active');
        }

        function deactivateButton(buttonName) {
            el.find('.fc-' + buttonName + '-button').removeClass(tm + '-state-active');
        }

        function disableButton(buttonName) {
            el.find('.fc-' + buttonName + '-button').prop('disabled', true).addClass(tm + '-state-disabled');
        }

        function enableButton(buttonName) {
            el.find('.fc-' + buttonName + '-button').prop('disabled', false).removeClass(tm + '-state-disabled');
        }

        function getViewsWithButtons() {
            return viewsWithButtons;
        }
    };
    ;FC.sourceNormalizers = [];
    FC.sourceFetchers = [];
    var ajaxDefaults = {dataType: 'json', cache: false};
    var eventGUID = 1;

    function EventManager(options) {
        var t = this;
        t.isFetchNeeded = isFetchNeeded;
        t.fetchEvents = fetchEvents;
        t.fetchEventSources = fetchEventSources;
        t.getEventSources = getEventSources;
        t.getEventSourceById = getEventSourceById;
        t.getEventSourcesByMatchArray = getEventSourcesByMatchArray;
        t.getEventSourcesByMatch = getEventSourcesByMatch;
        t.addEventSource = addEventSource;
        t.removeEventSource = removeEventSource;
        t.removeEventSources = removeEventSources;
        t.updateEvent = updateEvent;
        t.renderEvent = renderEvent;
        t.removeEvents = removeEvents;
        t.clientEvents = clientEvents;
        t.mutateEvent = mutateEvent;
        t.normalizeEventDates = normalizeEventDates;
        t.normalizeEventTimes = normalizeEventTimes;
        var reportEvents = t.reportEvents;
        var stickySource = {events: []};
        var sources = [stickySource];
        var rangeStart, rangeEnd;
        var pendingSourceCnt = 0;
        var cache = [];
        $.each((options.events ? [options.events] : []).concat(options.eventSources || []), function (i, sourceInput) {
            var source = buildEventSource(sourceInput);
            if (source) {
                sources.push(source);
            }
        });

        function isFetchNeeded(start, end) {
            return !rangeStart || start < rangeStart || end > rangeEnd;
        }

        function fetchEvents(start, end) {
            rangeStart = start;
            rangeEnd = end;
            fetchEventSources(sources, 'reset');
        }

        function fetchEventSources(specificSources, specialFetchType) {
            var i, source;
            if (specialFetchType === 'reset') {
                cache = [];
            } else if (specialFetchType !== 'add') {
                cache = excludeEventsBySources(cache, specificSources);
            }
            for (i = 0; i < specificSources.length; i++) {
                source = specificSources[i];
                if (source._status !== 'pending') {
                    pendingSourceCnt++;
                }
                source._fetchId = (source._fetchId || 0) + 1;
                source._status = 'pending';
            }
            for (i = 0; i < specificSources.length; i++) {
                source = specificSources[i];
                tryFetchEventSource(source, source._fetchId);
            }
        }

        function tryFetchEventSource(source, fetchId) {
            _fetchEventSource(source, function (eventInputs) {
                var isArraySource = $.isArray(source.events);
                var i, eventInput;
                var abstractEvent;
                if (fetchId === source._fetchId && source._status !== 'rejected') {
                    source._status = 'resolved';
                    if (eventInputs) {
                        for (i = 0; i < eventInputs.length; i++) {
                            eventInput = eventInputs[i];
                            if (isArraySource) {
                                abstractEvent = eventInput;
                            } else {
                                abstractEvent = buildEventFromInput(eventInput, source);
                            }
                            if (abstractEvent) {
                                cache.push.apply(cache, expandEvent(abstractEvent));
                            }
                        }
                    }
                    decrementPendingSourceCnt();
                }
            });
        }

        function rejectEventSource(source) {
            var wasPending = source._status === 'pending';
            source._status = 'rejected';
            if (wasPending) {
                decrementPendingSourceCnt();
            }
        }

        function decrementPendingSourceCnt() {
            pendingSourceCnt--;
            if (!pendingSourceCnt) {
                reportEvents(cache);
            }
        }

        function _fetchEventSource(source, callback) {
            var i;
            var fetchers = FC.sourceFetchers;
            var res;
            for (i = 0; i < fetchers.length; i++) {
                res = fetchers[i].call(t, source, rangeStart.clone(), rangeEnd.clone(), options.timezone, callback);
                if (res === true) {
                    return;
                } else if (typeof res == 'object') {
                    _fetchEventSource(res, callback);
                    return;
                }
            }
            var events = source.events;
            if (events) {
                if ($.isFunction(events)) {
                    t.pushLoading();
                    events.call(t, rangeStart.clone(), rangeEnd.clone(), options.timezone, function (events) {
                        callback(events);
                        t.popLoading();
                    });
                } else if ($.isArray(events)) {
                    callback(events);
                } else {
                    callback();
                }
            } else {
                var url = source.url;
                if (url) {
                    var success = source.success;
                    var error = source.error;
                    var complete = source.complete;
                    var customData;
                    if ($.isFunction(source.data)) {
                        customData = source.data();
                    } else {
                        customData = source.data;
                    }
                    var data = $.extend({}, customData || {});
                    var startParam = firstDefined(source.startParam, options.startParam);
                    var endParam = firstDefined(source.endParam, options.endParam);
                    var timezoneParam = firstDefined(source.timezoneParam, options.timezoneParam);
                    if (startParam) {
                        data[startParam] = rangeStart.format();
                    }
                    if (endParam) {
                        data[endParam] = rangeEnd.format();
                    }
                    if (options.timezone && options.timezone != 'local') {
                        data[timezoneParam] = options.timezone;
                    }
                    t.pushLoading();
                    $.ajax($.extend({}, ajaxDefaults, source, {
                        data: data, success: function (events) {
                            events = events || [];
                            var res = applyAll(success, this, arguments);
                            if ($.isArray(res)) {
                                events = res;
                            }
                            callback(events);
                        }, error: function () {
                            applyAll(error, this, arguments);
                            callback();
                        }, complete: function () {
                            applyAll(complete, this, arguments);
                            t.popLoading();
                        }
                    }));
                } else {
                    callback();
                }
            }
        }

        function addEventSource(sourceInput) {
            var source = buildEventSource(sourceInput);
            if (source) {
                sources.push(source);
                fetchEventSources([source], 'add');
            }
        }

        function buildEventSource(sourceInput) {
            var normalizers = FC.sourceNormalizers;
            var source;
            var i;
            if ($.isFunction(sourceInput) || $.isArray(sourceInput)) {
                source = {events: sourceInput};
            } else if (typeof sourceInput === 'string') {
                source = {url: sourceInput};
            } else if (typeof sourceInput === 'object') {
                source = $.extend({}, sourceInput);
            }
            if (source) {
                if (source.className) {
                    if (typeof source.className === 'string') {
                        source.className = source.className.split(/\s+/);
                    }
                } else {
                    source.className = [];
                }
                if ($.isArray(source.events)) {
                    source.origArray = source.events;
                    source.events = $.map(source.events, function (eventInput) {
                        return buildEventFromInput(eventInput, source);
                    });
                }
                for (i = 0; i < normalizers.length; i++) {
                    normalizers[i].call(t, source);
                }
                return source;
            }
        }

        function removeEventSource(matchInput) {
            removeSpecificEventSources(getEventSourcesByMatch(matchInput));
        }

        function removeEventSources(matchInputs) {
            if (matchInputs == null) {
                removeSpecificEventSources(sources, true);
            } else {
                removeSpecificEventSources(getEventSourcesByMatchArray(matchInputs));
            }
        }

        function removeSpecificEventSources(targetSources, isAll) {
            var i;
            for (i = 0; i < targetSources.length; i++) {
                rejectEventSource(targetSources[i]);
            }
            if (isAll) {
                sources = [];
                cache = [];
            } else {
                sources = $.grep(sources, function (source) {
                    for (i = 0; i < targetSources.length; i++) {
                        if (source === targetSources[i]) {
                            return false;
                        }
                    }
                    return true;
                });
                cache = excludeEventsBySources(cache, targetSources);
            }
            reportEvents(cache);
        }

        function getEventSources() {
            return sources.slice(1);
        }

        function getEventSourceById(id) {
            return $.grep(sources, function (source) {
                return source.id && source.id === id;
            })[0];
        }

        function getEventSourcesByMatchArray(matchInputs) {
            if (!matchInputs) {
                matchInputs = [];
            } else if (!$.isArray(matchInputs)) {
                matchInputs = [matchInputs];
            }
            var matchingSources = [];
            var i;
            for (i = 0; i < matchInputs.length; i++) {
                matchingSources.push.apply(matchingSources, getEventSourcesByMatch(matchInputs[i]));
            }
            return matchingSources;
        }

        function getEventSourcesByMatch(matchInput) {
            var i, source;
            for (i = 0; i < sources.length; i++) {
                source = sources[i];
                if (source === matchInput) {
                    return [source];
                }
            }
            source = getEventSourceById(matchInput);
            if (source) {
                return [source];
            }
            return $.grep(sources, function (source) {
                return isSourcesEquivalent(matchInput, source);
            });
        }

        function isSourcesEquivalent(source1, source2) {
            return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
        }

        function getSourcePrimitive(source) {
            return ((typeof source === 'object') ? (source.origArray || source.googleCalendarId || source.url || source.events) : null) || source;
        }

        function excludeEventsBySources(specificEvents, specificSources) {
            return $.grep(specificEvents, function (event) {
                for (var i = 0; i < specificSources.length; i++) {
                    if (event.source === specificSources[i]) {
                        return false;
                    }
                }
                return true;
            });
        }

        function updateEvent(event) {
            event.start = t.moment(event.start);
            if (event.end) {
                event.end = t.moment(event.end);
            } else {
                event.end = null;
            }
            mutateEvent(event, getMiscEventProps(event));
            reportEvents(cache);
        }

        function getMiscEventProps(event) {
            var props = {};
            $.each(event, function (name, val) {
                if (isMiscEventPropName(name)) {
                    if (val !== undefined && isAtomic(val)) {
                        props[name] = val;
                    }
                }
            });
            return props;
        }

        function isMiscEventPropName(name) {
            return !/^_|^(id|allDay|start|end)$/.test(name);
        }

        function renderEvent(eventInput, stick) {
            var abstractEvent = buildEventFromInput(eventInput);
            var events;
            var i, event;
            if (abstractEvent) {
                events = expandEvent(abstractEvent);
                for (i = 0; i < events.length; i++) {
                    event = events[i];
                    if (!event.source) {
                        if (stick) {
                            stickySource.events.push(event);
                            event.source = stickySource;
                        }
                        cache.push(event);
                    }
                }
                reportEvents(cache);
                return events;
            }
            return [];
        }

        function removeEvents(filter) {
            var eventID;
            var i;
            if (filter == null) {
                filter = function () {
                    return true;
                };
            } else if (!$.isFunction(filter)) {
                eventID = filter + '';
                filter = function (event) {
                    return event._id == eventID;
                };
            }
            cache = $.grep(cache, filter, true);
            for (i = 0; i < sources.length; i++) {
                if ($.isArray(sources[i].events)) {
                    sources[i].events = $.grep(sources[i].events, filter, true);
                }
            }
            reportEvents(cache);
        }

        function clientEvents(filter) {
            if ($.isFunction(filter)) {
                return $.grep(cache, filter);
            } else if (filter != null) {
                filter += '';
                return $.grep(cache, function (e) {
                    return e._id == filter;
                });
            }
            return cache;
        }

        function buildEventFromInput(input, source) {
            var out = {};
            var start, end;
            var allDay;
            if (options.eventDataTransform) {
                input = options.eventDataTransform(input);
            }
            if (source && source.eventDataTransform) {
                input = source.eventDataTransform(input);
            }
            $.extend(out, input);
            if (source) {
                out.source = source;
            }
            out._id = input._id || (input.id === undefined ? '_fc' + eventGUID++ : input.id + '');
            if (input.className) {
                if (typeof input.className == 'string') {
                    out.className = input.className.split(/\s+/);
                } else {
                    out.className = input.className;
                }
            } else {
                out.className = [];
            }
            start = input.start || input.date;
            end = input.end;
            if (isTimeString(start)) {
                start = moment.duration(start);
            }
            if (isTimeString(end)) {
                end = moment.duration(end);
            }
            if (input.dow || moment.isDuration(start) || moment.isDuration(end)) {
                out.start = start ? moment.duration(start) : null;
                out.end = end ? moment.duration(end) : null;
                out._recurring = true;
            } else {
                if (start) {
                    start = t.moment(start);
                    if (!start.isValid()) {
                        return false;
                    }
                }
                if (end) {
                    end = t.moment(end);
                    if (!end.isValid()) {
                        end = null;
                    }
                }
                allDay = input.allDay;
                if (allDay === undefined) {
                    allDay = firstDefined(source ? source.allDayDefault : undefined, options.allDayDefault);
                }
                assignDatesToEvent(start, end, allDay, out);
            }
            t.normalizeEvent(out);
            return out;
        }

        function assignDatesToEvent(start, end, allDay, event) {
            event.start = start;
            event.end = end;
            event.allDay = allDay;
            normalizeEventDates(event);
            backupEventDates(event);
        }

        function normalizeEventDates(eventProps) {
            normalizeEventTimes(eventProps);
            if (eventProps.end && !eventProps.end.isAfter(eventProps.start)) {
                eventProps.end = null;
            }
            if (!eventProps.end) {
                if (options.forceEventDuration) {
                    eventProps.end = t.getDefaultEventEnd(eventProps.allDay, eventProps.start);
                } else {
                    eventProps.end = null;
                }
            }
        }

        function normalizeEventTimes(eventProps) {
            if (eventProps.allDay == null) {
                eventProps.allDay = !(eventProps.start.hasTime() || (eventProps.end && eventProps.end.hasTime()));
            }
            if (eventProps.allDay) {
                eventProps.start.stripTime();
                if (eventProps.end) {
                    eventProps.end.stripTime();
                }
            } else {
                if (!eventProps.start.hasTime()) {
                    eventProps.start = t.applyTimezone(eventProps.start.time(0));
                }
                if (eventProps.end && !eventProps.end.hasTime()) {
                    eventProps.end = t.applyTimezone(eventProps.end.time(0));
                }
            }
        }

        function expandEvent(abstractEvent, _rangeStart, _rangeEnd) {
            var events = [];
            var dowHash;
            var dow;
            var i;
            var date;
            var startTime, endTime;
            var start, end;
            var event;
            _rangeStart = _rangeStart || rangeStart;
            _rangeEnd = _rangeEnd || rangeEnd;
            if (abstractEvent) {
                if (abstractEvent._recurring) {
                    if ((dow = abstractEvent.dow)) {
                        dowHash = {};
                        for (i = 0; i < dow.length; i++) {
                            dowHash[dow[i]] = true;
                        }
                    }
                    date = _rangeStart.clone().stripTime();
                    while (date.isBefore(_rangeEnd)) {
                        if (!dowHash || dowHash[date.day()]) {
                            startTime = abstractEvent.start;
                            endTime = abstractEvent.end;
                            start = date.clone();
                            end = null;
                            if (startTime) {
                                start = start.time(startTime);
                            }
                            if (endTime) {
                                end = date.clone().time(endTime);
                            }
                            event = $.extend({}, abstractEvent);
                            assignDatesToEvent(start, end, !startTime && !endTime, event);
                            events.push(event);
                        }
                        date.add(1, 'days');
                    }
                } else {
                    events.push(abstractEvent);
                }
            }
            return events;
        }

        function mutateEvent(event, newProps, largeUnit) {
            var miscProps = {};
            var oldProps;
            var clearEnd;
            var startDelta;
            var endDelta;
            var durationDelta;
            var undoFunc;

            function diffDates(date1, date0) {
                if (largeUnit) {
                    return diffByUnit(date1, date0, largeUnit);
                } else if (newProps.allDay) {
                    return diffDay(date1, date0);
                } else {
                    return diffDayTime(date1, date0);
                }
            }

            newProps = newProps || {};
            if (!newProps.start) {
                newProps.start = event.start.clone();
            }
            if (newProps.end === undefined) {
                newProps.end = event.end ? event.end.clone() : null;
            }
            if (newProps.allDay == null) {
                newProps.allDay = event.allDay;
            }
            normalizeEventDates(newProps);
            oldProps = {
                start: event._start.clone(),
                end: event._end ? event._end.clone() : t.getDefaultEventEnd(event._allDay, event._start),
                allDay: newProps.allDay
            };
            normalizeEventDates(oldProps);
            clearEnd = event._end !== null && newProps.end === null;
            startDelta = diffDates(newProps.start, oldProps.start);
            if (newProps.end) {
                endDelta = diffDates(newProps.end, oldProps.end);
                durationDelta = endDelta.subtract(startDelta);
            } else {
                durationDelta = null;
            }
            $.each(newProps, function (name, val) {
                if (isMiscEventPropName(name)) {
                    if (val !== undefined) {
                        miscProps[name] = val;
                    }
                }
            });
            undoFunc = mutateEvents(clientEvents(event._id), clearEnd, newProps.allDay, startDelta, durationDelta, miscProps);
            return {dateDelta: startDelta, durationDelta: durationDelta, undo: undoFunc};
        }

        function mutateEvents(events, clearEnd, allDay, dateDelta, durationDelta, miscProps) {
            var isAmbigTimezone = t.getIsAmbigTimezone();
            var undoFunctions = [];
            if (dateDelta && !dateDelta.valueOf()) {
                dateDelta = null;
            }
            if (durationDelta && !durationDelta.valueOf()) {
                durationDelta = null;
            }
            $.each(events, function (i, event) {
                var oldProps;
                var newProps;
                oldProps = {
                    start: event.start.clone(),
                    end: event.end ? event.end.clone() : null,
                    allDay: event.allDay
                };
                $.each(miscProps, function (name) {
                    oldProps[name] = event[name];
                });
                newProps = {start: event._start, end: event._end, allDay: allDay};
                normalizeEventDates(newProps);
                if (clearEnd) {
                    newProps.end = null;
                } else if (durationDelta && !newProps.end) {
                    newProps.end = t.getDefaultEventEnd(newProps.allDay, newProps.start);
                }
                if (dateDelta) {
                    newProps.start.add(dateDelta);
                    if (newProps.end) {
                        newProps.end.add(dateDelta);
                    }
                }
                if (durationDelta) {
                    newProps.end.add(durationDelta);
                }
                if (isAmbigTimezone && !newProps.allDay && (dateDelta || durationDelta)) {
                    newProps.start.stripZone();
                    if (newProps.end) {
                        newProps.end.stripZone();
                    }
                }
                $.extend(event, miscProps, newProps);
                backupEventDates(event);
                undoFunctions.push(function () {
                    $.extend(event, oldProps);
                    backupEventDates(event);
                });
            });
            return function () {
                for (var i = 0; i < undoFunctions.length; i++) {
                    undoFunctions[i]();
                }
            };
        }

        t.getBusinessHoursEvents = getBusinessHoursEvents;

        function getBusinessHoursEvents(wholeDay) {
            var optionVal = options.businessHours;
            var defaultVal = {
                className: 'fc-nonbusiness',
                start: '09:00',
                end: '17:00',
                dow: [1, 2, 3, 4, 5],
                rendering: 'inverse-background'
            };
            var view = t.getView();
            var eventInput;
            if (optionVal) {
                eventInput = $.extend({}, defaultVal, typeof optionVal === 'object' ? optionVal : {});
            }
            if (eventInput) {
                if (wholeDay) {
                    eventInput.start = null;
                    eventInput.end = null;
                }
                return expandEvent(buildEventFromInput(eventInput), view.start, view.end);
            }
            return [];
        }

        t.isEventSpanAllowed = isEventSpanAllowed;
        t.isExternalSpanAllowed = isExternalSpanAllowed;
        t.isSelectionSpanAllowed = isSelectionSpanAllowed;

        function isEventSpanAllowed(span, event) {
            var source = event.source || {};
            var constraint = firstDefined(event.constraint, source.constraint, options.eventConstraint);
            var overlap = firstDefined(event.overlap, source.overlap, options.eventOverlap);
            return isSpanAllowed(span, constraint, overlap, event);
        }

        function isExternalSpanAllowed(eventSpan, eventLocation, eventProps) {
            var eventInput;
            var event;
            if (eventProps) {
                eventInput = $.extend({}, eventProps, eventLocation);
                event = expandEvent(buildEventFromInput(eventInput))[0];
            }
            if (event) {
                return isEventSpanAllowed(eventSpan, event);
            } else {
                return isSelectionSpanAllowed(eventSpan);
            }
        }

        function isSelectionSpanAllowed(span) {
            return isSpanAllowed(span, options.selectConstraint, options.selectOverlap);
        }

        function isSpanAllowed(span, constraint, overlap, event) {
            var constraintEvents;
            var anyContainment;
            var peerEvents;
            var i, peerEvent;
            var peerOverlap;
            if (constraint != null) {
                constraintEvents = constraintToEvents(constraint);
                anyContainment = false;
                for (i = 0; i < constraintEvents.length; i++) {
                    if (eventContainsRange(constraintEvents[i], span)) {
                        anyContainment = true;
                        break;
                    }
                }
                if (!anyContainment) {
                    return false;
                }
            }
            peerEvents = t.getPeerEvents(span, event);
            for (i = 0; i < peerEvents.length; i++) {
                peerEvent = peerEvents[i];
                if (eventIntersectsRange(peerEvent, span)) {
                    if (overlap === false) {
                        return false;
                    } else if (typeof overlap === 'function' && !overlap(peerEvent, event)) {
                        return false;
                    }
                    if (event) {
                        peerOverlap = firstDefined(peerEvent.overlap, (peerEvent.source || {}).overlap);
                        if (peerOverlap === false) {
                            return false;
                        }
                        if (typeof peerOverlap === 'function' && !peerOverlap(event, peerEvent)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function constraintToEvents(constraintInput) {
            if (constraintInput === 'businessHours') {
                return getBusinessHoursEvents();
            }
            if (typeof constraintInput === 'object') {
                return expandEvent(buildEventFromInput(constraintInput));
            }
            return clientEvents(constraintInput);
        }

        function eventContainsRange(event, range) {
            var eventStart = event.start.clone().stripZone();
            var eventEnd = t.getEventEnd(event).stripZone();
            return range.start >= eventStart && range.end <= eventEnd;
        }

        function eventIntersectsRange(event, range) {
            var eventStart = event.start.clone().stripZone();
            var eventEnd = t.getEventEnd(event).stripZone();
            return range.start < eventEnd && range.end > eventStart;
        }

        t.getEventCache = function () {
            return cache;
        };
    }

    Calendar.prototype.normalizeEvent = function (event) {
    };
    Calendar.prototype.getPeerEvents = function (span, event) {
        var cache = this.getEventCache();
        var peerEvents = [];
        var i, otherEvent;
        for (i = 0; i < cache.length; i++) {
            otherEvent = cache[i];
            if (!event || event._id !== otherEvent._id) {
                peerEvents.push(otherEvent);
            }
        }
        return peerEvents;
    };

    function backupEventDates(event) {
        event._allDay = event.allDay;
        event._start = event.start.clone();
        event._end = event.end ? event.end.clone() : null;
    };
    ;var BasicView = FC.BasicView = View.extend({
        scroller: null,
        dayGridClass: DayGrid,
        dayGrid: null,
        dayNumbersVisible: false,
        weekNumbersVisible: false,
        weekNumberWidth: null,
        headContainerEl: null,
        headRowEl: null,
        initialize: function () {
            this.dayGrid = this.instantiateDayGrid();
            this.scroller = new Scroller({overflowX: 'hidden', overflowY: 'auto'});
        },
        instantiateDayGrid: function () {
            var subclass = this.dayGridClass.extend(basicDayGridMethods);
            return new subclass(this);
        },
        setRange: function (range) {
            View.prototype.setRange.call(this, range);
            this.dayGrid.breakOnWeeks = /year|month|week/.test(this.intervalUnit);
            this.dayGrid.setRange(range);
        },
        computeRange: function (date) {
            var range = View.prototype.computeRange.call(this, date);
            if (/year|month/.test(range.intervalUnit)) {
                range.start.startOf('week');
                range.start = this.skipHiddenDays(range.start);
                if (range.end.weekday()) {
                    range.end.add(1, 'week').startOf('week');
                    range.end = this.skipHiddenDays(range.end, -1, true);
                }
            }
            return range;
        },
        renderDates: function () {
            this.dayNumbersVisible = this.dayGrid.rowCnt > 1;
            this.weekNumbersVisible = this.opt('weekNumbers');
            this.dayGrid.numbersVisible = this.dayNumbersVisible || this.weekNumbersVisible;
            this.el.addClass('fc-basic-view').html(this.renderSkeletonHtml());
            this.renderHead();
            this.scroller.render();
            var dayGridContainerEl = this.scroller.el.addClass('fc-day-grid-container');
            var dayGridEl = $('<div class="fc-day-grid" />').appendTo(dayGridContainerEl);
            this.el.find('.fc-body > tr > td').append(dayGridContainerEl);
            this.dayGrid.setElement(dayGridEl);
            this.dayGrid.renderDates(this.hasRigidRows());
        },
        renderHead: function () {
            this.headContainerEl = this.el.find('.fc-head-container').html(this.dayGrid.renderHeadHtml());
            this.headRowEl = this.headContainerEl.find('.fc-row');
        },
        unrenderDates: function () {
            this.dayGrid.unrenderDates();
            this.dayGrid.removeElement();
            this.scroller.destroy();
        },
        renderBusinessHours: function () {
            this.dayGrid.renderBusinessHours();
        },
        renderSkeletonHtml: function () {
            return '' +
                '<table>' +
                '<thead class="fc-head">' +
                '<tr>' +
                '<td class="fc-head-container ' + this.widgetHeaderClass + '"></td>' +
                '</tr>' +
                '</thead>' +
                '<tbody class="fc-body">' +
                '<tr>' +
                '<td class="' + this.widgetContentClass + '"></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>';
        },
        weekNumberStyleAttr: function () {
            if (this.weekNumberWidth !== null) {
                return 'style="width:' + this.weekNumberWidth + 'px"';
            }
            return '';
        },
        hasRigidRows: function () {
            var eventLimit = this.opt('eventLimit');
            return eventLimit && typeof eventLimit !== 'number';
        },
        updateWidth: function () {
            if (this.weekNumbersVisible) {
                this.weekNumberWidth = matchCellWidths(this.el.find('.fc-week-number'));
            }
        },
        setHeight: function (totalHeight, isAuto) {
            var eventLimit = this.opt('eventLimit');
            var scrollerHeight;
            var scrollbarWidths;
            this.scroller.clear();
            uncompensateScroll(this.headRowEl);
            this.dayGrid.removeSegPopover();
            if (eventLimit && typeof eventLimit === 'number') {
                this.dayGrid.limitRows(eventLimit);
            }
            scrollerHeight = this.computeScrollerHeight(totalHeight);
            this.setGridHeight(scrollerHeight, isAuto);
            if (eventLimit && typeof eventLimit !== 'number') {
                this.dayGrid.limitRows(eventLimit);
            }
            if (!isAuto) {
                this.scroller.setHeight(scrollerHeight);
                scrollbarWidths = this.scroller.getScrollbarWidths();
                if (scrollbarWidths.left || scrollbarWidths.right) {
                    compensateScroll(this.headRowEl, scrollbarWidths);
                    scrollerHeight = this.computeScrollerHeight(totalHeight);
                    this.scroller.setHeight(scrollerHeight);
                }
                this.scroller.lockOverflow(scrollbarWidths);
            }
        },
        computeScrollerHeight: function (totalHeight) {
            return totalHeight -
                subtractInnerElHeight(this.el, this.scroller.el);
        },
        setGridHeight: function (height, isAuto) {
            if (isAuto) {
                undistributeHeight(this.dayGrid.rowEls);
            } else {
                distributeHeight(this.dayGrid.rowEls, height, true);
            }
        },
        queryScroll: function () {
            return this.scroller.getScrollTop();
        },
        setScroll: function (top) {
            this.scroller.setScrollTop(top);
        },
        prepareHits: function () {
            this.dayGrid.prepareHits();
        },
        releaseHits: function () {
            this.dayGrid.releaseHits();
        },
        queryHit: function (left, top) {
            return this.dayGrid.queryHit(left, top);
        },
        getHitSpan: function (hit) {
            return this.dayGrid.getHitSpan(hit);
        },
        getHitEl: function (hit) {
            return this.dayGrid.getHitEl(hit);
        },
        renderEvents: function (events) {
            this.dayGrid.renderEvents(events);
            this.updateHeight();
        },
        getEventSegs: function () {
            return this.dayGrid.getEventSegs();
        },
        unrenderEvents: function () {
            this.dayGrid.unrenderEvents();
        },
        renderDrag: function (dropLocation, seg) {
            return this.dayGrid.renderDrag(dropLocation, seg);
        },
        unrenderDrag: function () {
            this.dayGrid.unrenderDrag();
        },
        renderSelection: function (span) {
            this.dayGrid.renderSelection(span);
        },
        unrenderSelection: function () {
            this.dayGrid.unrenderSelection();
        }
    });
    var basicDayGridMethods = {
        renderHeadIntroHtml: function () {
            var view = this.view;
            if (view.weekNumbersVisible) {
                return '' +
                    '<th class="fc-week-number ' + view.widgetHeaderClass + '" ' + view.weekNumberStyleAttr() + '>' +
                    '<span>' +
                    htmlEscape(view.opt('weekNumberTitle')) +
                    '</span>' +
                    '</th>';
            }
            return '';
        }, renderNumberIntroHtml: function (row) {
            var view = this.view;
            if (view.weekNumbersVisible) {
                return '' +
                    '<td class="fc-week-number" ' + view.weekNumberStyleAttr() + '>' +
                    '<span>' +
                    this.getCellDate(row, 0).format('w') +
                    '</span>' +
                    '</td>';
            }
            return '';
        }, renderBgIntroHtml: function () {
            var view = this.view;
            if (view.weekNumbersVisible) {
                return '<td class="fc-week-number ' + view.widgetContentClass + '" ' +
                    view.weekNumberStyleAttr() + '></td>';
            }
            return '';
        }, renderIntroHtml: function () {
            var view = this.view;
            if (view.weekNumbersVisible) {
                return '<td class="fc-week-number" ' + view.weekNumberStyleAttr() + '></td>';
            }
            return '';
        }
    };
    ;
    ;var MonthView = FC.MonthView = BasicView.extend({
        computeRange: function (date) {
            var range = BasicView.prototype.computeRange.call(this, date);
            var rowCnt;
            if (this.isFixedWeeks()) {
                rowCnt = Math.ceil(range.end.diff(range.start, 'weeks', true));
                range.end.add(6 - rowCnt, 'weeks');
            }
            return range;
        }, setGridHeight: function (height, isAuto) {
            isAuto = isAuto || this.opt('weekMode') === 'variable';
            if (isAuto) {
                height *= this.rowCnt / 6;
            }
            distributeHeight(this.dayGrid.rowEls, height, !isAuto);
        }, isFixedWeeks: function () {
            var weekMode = this.opt('weekMode');
            if (weekMode) {
                return weekMode === 'fixed';
            }
            return this.opt('fixedWeekCount');
        }
    });
    ;
    ;fcViews.basic = {'class': BasicView};
    fcViews.basicDay = {type: 'basic', duration: {days: 1}};
    fcViews.basicWeek = {type: 'basic', duration: {weeks: 1}};
    fcViews.month = {'class': MonthView, duration: {months: 1}, defaults: {fixedWeekCount: true}};
    ;
    ;var AgendaView = FC.AgendaView = View.extend({
        scroller: null,
        timeGridClass: TimeGrid,
        timeGrid: null,
        dayGridClass: DayGrid,
        dayGrid: null,
        axisWidth: null,
        headContainerEl: null,
        noScrollRowEls: null,
        bottomRuleEl: null,
        initialize: function () {
            this.timeGrid = this.instantiateTimeGrid();
            if (this.opt('allDaySlot')) {
                this.dayGrid = this.instantiateDayGrid();
            }
            this.scroller = new Scroller({overflowX: 'hidden', overflowY: 'auto'});
        },
        instantiateTimeGrid: function () {
            var subclass = this.timeGridClass.extend(agendaTimeGridMethods);
            return new subclass(this);
        },
        instantiateDayGrid: function () {
            var subclass = this.dayGridClass.extend(agendaDayGridMethods);
            return new subclass(this);
        },
        setRange: function (range) {
            View.prototype.setRange.call(this, range);
            this.timeGrid.setRange(range);
            if (this.dayGrid) {
                this.dayGrid.setRange(range);
            }
        },
        renderDates: function () {
            this.el.addClass('fc-agenda-view').html(this.renderSkeletonHtml());
            this.renderHead();
            this.scroller.render();
            var timeGridWrapEl = this.scroller.el.addClass('fc-time-grid-container');
            var timeGridEl = $('<div class="fc-time-grid" />').appendTo(timeGridWrapEl);
            this.el.find('.fc-body > tr > td').append(timeGridWrapEl);
            this.timeGrid.setElement(timeGridEl);
            this.timeGrid.renderDates();
            this.bottomRuleEl = $('<hr class="fc-divider ' + this.widgetHeaderClass + '"/>').appendTo(this.timeGrid.el);
            if (this.dayGrid) {
                this.dayGrid.setElement(this.el.find('.fc-day-grid'));
                this.dayGrid.renderDates();
                this.dayGrid.bottomCoordPadding = this.dayGrid.el.next('hr').outerHeight();
            }
            this.noScrollRowEls = this.el.find('.fc-row:not(.fc-scroller *)');
        },
        renderHead: function () {
            this.headContainerEl = this.el.find('.fc-head-container').html(this.timeGrid.renderHeadHtml());
        },
        unrenderDates: function () {
            this.timeGrid.unrenderDates();
            this.timeGrid.removeElement();
            if (this.dayGrid) {
                this.dayGrid.unrenderDates();
                this.dayGrid.removeElement();
            }
            this.scroller.destroy();
        },
        renderSkeletonHtml: function () {
            return '' +
                '<table> ' +
                '<thead class="fc-head">' +
                '<tr>' +
                '<td class="fc-head-container ' + this.widgetHeaderClass + '"></td>' +
                '</tr>' +
                '</thead>' +
                '<tbody class="fc-body">' +
                '<div class="see-allplanning uk-text-center">\n' +
                '<a class="uk-button uk-button-medium uk-notransform uk-button-border-blue " href="planning.html">Voir le planning en détail</a></div>' +
                '<tr>' +
                '<td class="' + this.widgetContentClass + '">' +
                (this.dayGrid ? '<div class="fc-day-grid"/>' +
                    '<hr class="fc-divider ' + this.widgetHeaderClass + '"/>' : '') +
                '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>';
        },
        axisStyleAttr: function () {
            if (this.axisWidth !== null) {
                return 'style="width:' + this.axisWidth + 'px"';
            }
            return '';
        },
        renderBusinessHours: function () {
            this.timeGrid.renderBusinessHours();
            if (this.dayGrid) {
                this.dayGrid.renderBusinessHours();
            }
        },
        unrenderBusinessHours: function () {
            this.timeGrid.unrenderBusinessHours();
            if (this.dayGrid) {
                this.dayGrid.unrenderBusinessHours();
            }
        },
        getNowIndicatorUnit: function () {
            return this.timeGrid.getNowIndicatorUnit();
        },
        renderNowIndicator: function (date) {
            this.timeGrid.renderNowIndicator(date);
        },
        unrenderNowIndicator: function () {
            this.timeGrid.unrenderNowIndicator();
        },
        updateSize: function (isResize) {
            this.timeGrid.updateSize(isResize);
            View.prototype.updateSize.call(this, isResize);
        },
        updateWidth: function () {
            this.axisWidth = matchCellWidths(this.el.find('.fc-axis'));
        },
        setHeight: function (totalHeight, isAuto) {
            var eventLimit;
            var scrollerHeight;
            var scrollbarWidths;
            this.bottomRuleEl.hide();
            this.scroller.clear();
            uncompensateScroll(this.noScrollRowEls);
            if (this.dayGrid) {
                this.dayGrid.removeSegPopover();
                eventLimit = this.opt('eventLimit');
                if (eventLimit && typeof eventLimit !== 'number') {
                    eventLimit = AGENDA_ALL_DAY_EVENT_LIMIT;
                }
                if (eventLimit) {
                    this.dayGrid.limitRows(eventLimit);
                }
            }
            if (!isAuto) {
                scrollerHeight = this.computeScrollerHeight(totalHeight);
                this.scroller.setHeight(scrollerHeight);
                scrollbarWidths = this.scroller.getScrollbarWidths();
                if (scrollbarWidths.left || scrollbarWidths.right) {
                    compensateScroll(this.noScrollRowEls, scrollbarWidths);
                    scrollerHeight = this.computeScrollerHeight(totalHeight);
                    this.scroller.setHeight(scrollerHeight);
                }
                this.scroller.lockOverflow(scrollbarWidths);
                if (this.timeGrid.getTotalSlatHeight() < scrollerHeight) {
                    this.bottomRuleEl.show();
                }
            }
        },
        computeScrollerHeight: function (totalHeight) {
            return totalHeight -
                subtractInnerElHeight(this.el, this.scroller.el);
        },
        computeInitialScroll: function () {
            var scrollTime = moment.duration(this.opt('scrollTime'));
            var top = this.timeGrid.computeTimeTop(scrollTime);
            top = Math.ceil(top);
            if (top) {
                top++;
            }
            return top;
        },
        queryScroll: function () {
            return this.scroller.getScrollTop();
        },
        setScroll: function (top) {
            this.scroller.setScrollTop(top);
        },
        prepareHits: function () {
            this.timeGrid.prepareHits();
            if (this.dayGrid) {
                this.dayGrid.prepareHits();
            }
        },
        releaseHits: function () {
            this.timeGrid.releaseHits();
            if (this.dayGrid) {
                this.dayGrid.releaseHits();
            }
        },
        queryHit: function (left, top) {
            var hit = this.timeGrid.queryHit(left, top);
            if (!hit && this.dayGrid) {
                hit = this.dayGrid.queryHit(left, top);
            }
            return hit;
        },
        getHitSpan: function (hit) {
            return hit.component.getHitSpan(hit);
        },
        getHitEl: function (hit) {
            return hit.component.getHitEl(hit);
        },
        renderEvents: function (events) {
            var dayEvents = [];
            var timedEvents = [];
            var daySegs = [];
            var timedSegs;
            var i;
            for (i = 0; i < events.length; i++) {
                if (events[i].allDay) {
                    dayEvents.push(events[i]);
                } else {
                    timedEvents.push(events[i]);
                }
            }
            timedSegs = this.timeGrid.renderEvents(timedEvents);
            if (this.dayGrid) {
                daySegs = this.dayGrid.renderEvents(dayEvents);
            }
            this.updateHeight();
        },
        getEventSegs: function () {
            return this.timeGrid.getEventSegs().concat(this.dayGrid ? this.dayGrid.getEventSegs() : []);
        },
        unrenderEvents: function () {
            this.timeGrid.unrenderEvents();
            if (this.dayGrid) {
                this.dayGrid.unrenderEvents();
            }
        },
        renderDrag: function (dropLocation, seg) {
            if (dropLocation.start.hasTime()) {
                return this.timeGrid.renderDrag(dropLocation, seg);
            } else if (this.dayGrid) {
                return this.dayGrid.renderDrag(dropLocation, seg);
            }
        },
        unrenderDrag: function () {
            this.timeGrid.unrenderDrag();
            if (this.dayGrid) {
                this.dayGrid.unrenderDrag();
            }
        },
        renderSelection: function (span) {
            if (span.start.hasTime() || span.end.hasTime()) {
                this.timeGrid.renderSelection(span);
            } else if (this.dayGrid) {
                this.dayGrid.renderSelection(span);
            }
        },
        unrenderSelection: function () {
            this.timeGrid.unrenderSelection();
            if (this.dayGrid) {
                this.dayGrid.unrenderSelection();
            }
        }
    });
    var agendaTimeGridMethods = {
        renderHeadIntroHtml: function () {
            var view = this.view;
            var weekText;
            if (view.opt('weekNumbers')) {
                weekText = this.start.format(view.opt('smallWeekFormat'));
                return '' +
                    '<th class="fc-axis fc-week-number ' + view.widgetHeaderClass + '" ' + view.axisStyleAttr() + '>' +
                    '<span>' +
                    htmlEscape(weekText) +
                    '</span>' +
                    '</th>';
            } else {
                return '<th class="fc-axis ' + view.widgetHeaderClass + '" ' + view.axisStyleAttr() + '>' + view.options.labelColumnTime + '</th>';
            }
        }, renderBgIntroHtml: function () {
            var view = this.view;
            return '<td class="fc-axis ' + view.widgetContentClass + '" ' + view.axisStyleAttr() + '></td>';
        }, renderIntroHtml: function () {
            var view = this.view;
            return '<td class="fc-axis" ' + view.axisStyleAttr() + '></td>';
        }
    };
    var agendaDayGridMethods = {
        renderBgIntroHtml: function () {
            var view = this.view;
            return '' +
                '<td class="fc-axis ' + view.widgetContentClass + '" ' + view.axisStyleAttr() + '>' +
                '<span>' +
                (view.opt('allDayHtml') || htmlEscape(view.opt('allDayText'))) +
                '</span>' +
                '</td>';
        }, renderIntroHtml: function () {
            var view = this.view;
            return '<td class="fc-axis" ' + view.axisStyleAttr() + '></td>';
        }
    };
    ;
    ;var AGENDA_ALL_DAY_EVENT_LIMIT = 5;
    var AGENDA_STOCK_SUB_DURATIONS = [{hours: 1}, {minutes: 30}, {minutes: 15}, {seconds: 30}, {seconds: 15}];
    fcViews.agenda = {
        'class': AgendaView,
        defaults: {
            allDaySlot: true,
            allDayText: 'all-day',
            slotDuration: '00:30:00',
            minTime: '00:00:00',
            maxTime: '24:00:00',
            slotEventOverlap: true
        }
    };
    fcViews.agendaDay = {type: 'agenda', duration: {days: 1}};
    fcViews.agendaWeek = {type: 'agenda', duration: {weeks: 1}};
    ;
    ;
    return FC;
});