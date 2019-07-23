/*
jQuery.ganttView v.1.0.0
Copyright (c) 2019/07 ::liuhuajun 
MIT License Applies
base on jQuery
This plug-in is based on：jquery/jquery-ui/date.JS/holidays.JS
                            
*/

var ChartLang = {
    days: "days"
}; (function (jQuery) {
    jQuery.fn.ganttView = function (options) {
        var els = this;
        var defaults = {
            ganttScale: 'months',//months  weeks days  hours
            showWeekends: true, //是否现在周末高亮
            vtHeaderWidth: 250,//左侧任务模块宽度
            cellWidth: 21, //格子宽度(ganttScale = hours/weeks:宽度重新计算 最小为50)
            cellHeight: 21, //格子行高
            slideWidth: 400, //甘特图宽度
            showLine: false,//是否显示当前时间线
            titileHeight: 20,//标题行高
            vHeaderWidth: 100,
            blockClick: null,
            changed: null,
            clicked: null,
            dblClicked: null,
            readOnly: false, //只读(禁止拖动) readOnly:data数据参数选传项
            excludeWeekends: false, //排除星期的最后一天
            showDayOfWeek: false, //是否显示星期
            showHolidays: false, //显示节假日
            excludeHolidays: false, //排除节假日
            gridHoverL: true,//是否鼠标移入效果(列)
            gridHoverH: true,//是否鼠标移入效果(行)
            isUnfold:true,//模块下任务超过2条 显示展开收起按钮
            unfoldConfig:true,//初始化展开/收起(模块下任务超过2条 显示展开收起按钮)  true:收起
        };
        Chart.opts = jQuery.extend(defaults, options);
        var months = Chart.getMonths(); //获取月份的每一天日期
        var hours = Chart.getHours(); //获取一天内24小时
        var weeks = Chart.dayOfWeekNames //获取一周
        console.log(hours)
        els.each(function () {
            var container = jQuery(this);
            var div = jQuery("<div>", {
                "class": "ganttview"
            });
            Chart.addVtHeader(div);
            var slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                "css": {
                    "width": Chart.opts.slideWidth + "px"
                }
            });
            //显示相应表头
            if (Chart.opts.ganttScale == 'months') { //月
                Chart.addHzHeader(slideDiv, months);
                Chart.addGrid(slideDiv, months);
            } else if (Chart.opts.ganttScale == 'hours') { //小时
                //小时 重新计算格子宽度
                let rightcontentW = $('#ganttChart').width() - Chart.opts.vtHeaderWidth
                let HW = parseInt(rightcontentW / 24)
                if (HW < 50) { //最小宽度为50px
                    Chart.opts.cellWidth = 50 + 1
                } else {
                    Chart.opts.cellWidth = HW + 1
                }
                Chart.addHzHeader_Hours(slideDiv, hours, HW);
                Chart.addGrid(slideDiv, hours);
            } else if (Chart.opts.ganttScale == 'weeks') { //周
                //周 重新计算格子宽度
                let rightcontentW = $('#ganttChart').width() - Chart.opts.vtHeaderWidth
                let HW = parseInt(rightcontentW / 7)
                if (HW < 50) { //最小宽度为50px
                    Chart.opts.cellWidth = 50 + 1
                } else {
                    Chart.opts.cellWidth = HW + 1
                }
                Chart.addHzHeader_Weeks(slideDiv, weeks, HW, months);
                Chart.addGrid(slideDiv, weeks);
            }
            //初始化
            Chart.addBlockContainers(slideDiv);
            Chart.addBlocks(slideDiv);
            Chart.setBlockContainersWidth(slideDiv);
            div.append(slideDiv);
            container.append(div);
            //左侧列表宽度 右侧甘特图宽度
            var w = jQuery("div.ganttview-vtheader", container).outerWidth() + jQuery("div.ganttview-slide-container", container).outerWidth();
            div.css("width", w + "px");
            Chart.applyLastClass(container);
            Events.bindBlockClick(container, Chart.opts.blockClick);
            if (Chart.opts.gridHoverL || Chart.opts.gridHoverH) {
                Chart.Hover()
            }
            //任务文本内容超出时间范围处理
            $.each($('.ganttview-block-text-left'), function (index, item) {
                let w = $(item).width()
                let sibW = $(item).siblings('.gattview-icon-box').width()
                $(item).css({
                    'left': `${-(w + sibW + 10)}px`,
                    'margin-left': 'initial',
                })
            })
            //展开收起
            if(Chart.opts.isUnfold){
                Chart.Unfold()
            }
        });
    };
    var Chart = {
        selectedBlock: null,
        opts: null,
        monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        dayOfWeekNames: ["日", "一", "二", "三", "四", "五", "六"],
        //获取月份的每一天日期
        getMonths: function () {
            var opts = Chart.opts;
            var start = Date.parse(opts.start);
            var end = Date.parse(opts.end);
            var months = [];
            months[start.getMonth()] = [start];
            var last = start;
            while (last.compareTo(end) == -1) {
                var next = last.clone().addDays(1);
                if (!months[next.getMonth()]) {
                    months[next.getMonth()] = [];
                }
                months[next.getMonth()].push(next);
                last = next;
            }
            return months;
        },
        //获取一天内24小时
        getHours: function () {
            var opts = Chart.opts;
            var hours = [];
            for (var i = 0; i <= 24; i++) {
                if (i < 10) {
                    i = '0' + i
                }
                hours.push(`${i}`)
            }
            return hours;
        },
        //添加左侧任务模块列表
        addVtHeader: function (div) {
            var opts = Chart.opts;
            var data = opts.data;
            var cellHeight = opts.cellHeight;
            var cellWidth = opts.vtHeaderWidth
            var showDayOfWeek = opts.showDayOfWeek;
            var titileHeight = opts.titileHeight
            var w = 0
            if (Chart.opts.ganttScale == 'hours') {
                w = 0
                titileHeight = titileHeight
            } else if (Chart.opts.ganttScale == 'months') {
                w = opts.cellHeight * 2
                titileHeight = titileHeight * 3
            }
            var headerDiv = jQuery("<div>", {
                "class": "ganttview-vtheader",
                "css": {
                    "width": cellWidth + 'px',
                }
            });
            var dowsDiv = jQuery("<div>", {
                "class": "ganttview-vthheader-dows",
                "css": {
                    "height": titileHeight + 2 + "px",
                }
            });
            if (showDayOfWeek) {
                headerDiv.append(dowsDiv);
            }
            for (var i = 0; i < data.length; i++) {
                //第一层
                var itemDiv = jQuery("<div>", {
                    "id": "ganttview-vtheader-item-" + data[i].id,
                    "class": "ganttview-vtheader-item"
                });
                //第二层
                var seriesDiv = jQuery("<div>", {
                    "class": "ganttview-vtheader-series"
                });
                //第三层
                var seriesDiv_box = jQuery("<div>", {
                    "class": "ganttview-vtheader-series-box"
                });
                var nameDivWidth = ''
                var typeSeries = false
                var seriesDiv_item = ''
                var count = 0
                for (var j = 0; j < data[i].series.length; j++) {
                    if (data[i].series[j].serieslevel) { //类型超过三层
                        typeSeries = true
                        var seriesDiv_item_char = ''
                        var seriesDiv_item_height = data[i].series[j].serieslevel.length
                        for (var k = 0; k < data[i].series[j].serieslevel.length; k++) {
                            count++
                            //第三层(任务层)
                            var style = `height:${cellHeight}px;line-height:${cellHeight}px`
                            if(Chart.opts.unfoldConfig && k >= 2){ //默认收起/显示
                                style = `height:${cellHeight}px;line-height:${cellHeight}px;display:none;`
                            }
                            seriesDiv_item_char += `
                            <div class="ganttview-vtheader-series-name ganttview-vtheader-series-name-${data[i].series[j].serieslevel[k].id}" style="${style}"
                            id="ganttview-vtheader-series-name-${data[i].series[j].serieslevel[k].id}" data-typeId='${data[i].series[j].id}'>
                            ${data[i].series[j].serieslevel[k].name}</div>
                            `
                        }
                        nameDivWidth = (count * cellHeight) + count
                        //第一层 第二层任务(seriesDiv_item_char)
                        var style = `height:${seriesDiv_item_height * cellHeight}px;line-height:${seriesDiv_item_height * cellHeight}px`
                        seriesDiv_item += `
                            <div class="ganttview-vtheader-box ganttview-vtheader-box-${data[i].id}" 
                            id="ganttview-vtheader-box-${data[i].series[j].id}"><span class="ganttview-vtheader-tit">${data[i].series[j].name}</span>
                            <div class='ganttview-vtheader-content'>${seriesDiv_item_char}</div></div>
                        `
                    } else { //类型为两层(任务层)
                        typeSeries = false
                        var styleBox = ''
                        nameDivWidth = (data[i].series.length * cellHeight)
                        if(Chart.opts.unfoldConfig && j >= 2){ //默认收起/显示
                            styleBox = 'none'
                        }
                        seriesDiv.append(jQuery("<div>", {
                            "class": "ganttview-vtheader-series-name ganttview-vtheader-series-name-" + data[i].id,
                            "id": "ganttview-vtheader-series-name-" + data[i].series[j].id,
                            "css": {
                                "height": cellHeight + "px",
                                "line-height": cellHeight + 'px',
                                "display":styleBox
                            },
                            'data-typeId':data[i].id
                        }).append(data[i].series[j].name));
                    }
                }
                //第一层(类型模块)
                var nameDiv = jQuery("<div>", {
                    "id": "ganttview-vtheader-item-name-" + data[i].id,
                    "class": "ganttview-vtheader-item-name",
                    // "css": {
                    //     "height": nameDivWidth + "px",
                    //     "line-height": nameDivWidth + 'px',
                    // }
                });
                itemDiv.append(nameDiv.append(data[i].name));
                if (typeSeries) {
                    seriesDiv.html(seriesDiv_item);
                }
                itemDiv.append(seriesDiv);
                headerDiv.append(itemDiv);
            }
            div.append(headerDiv);
        },
        //添加甘特图日期头部(月份 星期 天)
        addHzHeader: function (div, months) {
            var opts = Chart.opts;
            var cellWidth = opts.cellWidth;
            var showWeekends = opts.showWeekends;
            var showDayOfWeek = opts.showDayOfWeek;
            var showHolidays = opts.showHolidays;
            var titileHeight = opts.titileHeight
            var totalW = 0;
            var headerDiv = jQuery("<div>", {
                "class": "ganttview-hzheader",
                "css": {
                    "height": titileHeight * 3 + "px",
                }
            });
            var monthsDiv = jQuery("<div>", {
                "class": "ganttview-hzheader-months",
                "css": {
                    "height": titileHeight + "px",
                }
            });
            var dowsDiv = jQuery("<div>", {
                "class": "ganttview-hzheader-dows",
                "css": {
                    "height": titileHeight + "px",
                }
            });
            var daysDiv = jQuery("<div>", {
                "class": "ganttview-hzheader-days",
                "css": {
                    "height": titileHeight + "px",
                }
            });
            for (var i = 0; i < 12; i++) {
                if (months[i]) {
                    var w = months[i].length * cellWidth;
                    totalW = totalW + w;
                    var x = 0;
                    for (var j = 0; j < months[i].length; j++) {
                        var cellDate = months[i][j];
                        if ((DateUtils.isWeekend(cellDate) && showWeekends) || !DateUtils.isWeekend(cellDate)) {
                            var dowDiv = jQuery("<div>", {
                                "class": "ganttview-hzheader-dow",
                                "css": {
                                    "width": opts.cellWidth - 1 + "px",
                                    "height": titileHeight + "px",
                                    "line-height": titileHeight + "px"
                                }
                            });
                            var dayDiv = jQuery("<div>", {
                                "class": "ganttview-hzheader-day",
                                "css": {
                                    "width": opts.cellWidth - 1 + "px",
                                    "height": titileHeight + "px",
                                    "line-height": titileHeight + "px"
                                }
                            });
                            if (DateUtils.isSaturday(cellDate)) {
                                dowDiv.addClass("ganttview-saturday")
                            };
                            if (DateUtils.isSunday(cellDate)) {
                                dowDiv.addClass("ganttview-sunday")
                            };
                            if (DateUtils.isSaturday(cellDate)) {
                                dayDiv.addClass("ganttview-saturday")
                            };
                            if (DateUtils.isSunday(cellDate)) {
                                dayDiv.addClass("ganttview-sunday")
                            };
                            if (showHolidays) {
                                for (var h in Holidays) {
                                    var holiday = Holidays[h];
                                    if (holiday.at.getTime() == Date.parse(cellDate).getTime()) {
                                        dowDiv.addClass("ganttview-holiday");
                                        dayDiv.addClass("ganttview-holiday");
                                        if (holiday.name) {
                                            dayDiv.attr("title", holiday.name);
                                        }
                                        if (holiday.color) {
                                            dowDiv.css("color", holiday.color);
                                            dayDiv.css("color", holiday.color);
                                        }
                                        if (holiday.backgroundColor) {
                                            dowDiv.css("background-color", holiday.backgroundColor);
                                            dayDiv.css("background-color", holiday.backgroundColor);
                                        }
                                        break;
                                    }
                                }
                            }
                            dowsDiv.append(dowDiv.append(Chart.dayOfWeekNames[cellDate.getDay()])); //渲染星期
                            daysDiv.append(dayDiv.append(cellDate.getDate())); //渲染每天日期
                            // console.log(cellDate.getDay(),cellDate.getDate())
                        } else {
                            x += cellWidth;
                        }
                    }
                    totalW -= x;
                    //渲染月份
                    monthsDiv.append(jQuery("<div>", {
                        "class": "ganttview-hzheader-month",
                        "css": {
                            "width": (w - x - 1) + "px",
                            "line-height": titileHeight + "px"
                        }
                    }).append(Chart.monthNames[i]));
                }
            }
            monthsDiv.css("width", totalW + "px");
            dowsDiv.css("width", totalW + "px");
            daysDiv.css("width", totalW + "px");
            if (showDayOfWeek) {
                headerDiv.append(monthsDiv).append(daysDiv).append(dowsDiv);
            } else {
                headerDiv.append(monthsDiv).append(daysDiv);
            }
            div.append(headerDiv);
        },
        //添加甘特图日期头部(小时)
        addHzHeader_Hours: function (div, hours, WH) {
            var opts = Chart.opts;
            var cellWidth = opts.cellWidth;
            var totalW = 0;
            var showLine = opts.showLine
            var titileHeight = opts.titileHeight
            var getMinutes = (new Date().getMinutes() / 60) * 100
            var headerDiv = jQuery("<div>", {
                "class": "ganttview-hzheader"
            });
            var hoursDiv = jQuery("<div>", {
                "class": "ganttview-hzheader-hours"
            });
            var hourDiv = ''
            for (var i = 0; i < 24; i++) {
                if (hours[i]) {
                    var w = (hours.length - 1) * cellWidth;
                    totalW = w;
                    var cellline = ''
                    var hourbefore = ''
                    var Style = `style="width:${WH < 50 ? 50 : WH}px;height:${titileHeight}px;line-height:${titileHeight}px;border-bottom: 1px solid #CCCCCC;"`
                    if (showLine) { //显示时间线
                        if (DateUtils.isShowline(hours[i])) {
                            cellline = `<div class="ganttview-grid-row-cell-line" style="width:${getMinutes}%"></div>`
                        };
                        if (DateUtils.isShowlineBefore(hours[i])) {
                            hourbefore = 'ganttview-hzheader-hour-before'
                        }
                    }
                    //渲染小时
                    hourDiv += `<div class='ganttview-hzheader-hour ${hourbefore}' ${Style}>${hours[i] + ':00'}${cellline}</div>`
                }
            }
            hoursDiv.html(hourDiv)
            hoursDiv.css({ 'width': `${totalW}px`, 'height': `${titileHeight}px` });
            headerDiv.append(hoursDiv);
            div.append(headerDiv);
        },
        //添加甘特图日期头部(周)
        addHzHeader_Weeks: function (div, weeks, WH, months) {
            var opts = Chart.opts;
            var cellWidth = opts.cellWidth;
            var totalW = 0;
            var titileHeight = opts.titileHeight
            var newmonths = months[months.length - 1]
            var showLine = opts.showLine
            var headerDiv = jQuery("<div>", {
                "class": "ganttview-hzheader"
            });
            var hoursDiv = jQuery("<div>", {
                "class": "ganttview-hzheader-weeks"
            });
            var hourDiv = ''
            var WeekNames = Chart.dayOfWeekNames
            for (var i = 0; i < WeekNames.length; i++) {
                if (weeks[i] && newmonths[i]) {
                    var getday = ''
                    var cellBack = ''
                    for (var j = 0; j < newmonths.length; j++) {
                        if (i == newmonths[j].getDay()) { //添加日期
                            getday = newmonths[j].getDate()
                            if (showLine) { //添加当天
                                if (DateUtils.isShowBack(newmonths[j])) {
                                    cellBack = '<span class="ganttview-hzheader-week-cellBack"></span>'
                                }
                            }
                        }
                    }
                    var w = (weeks.length) * cellWidth;
                    totalW = w;
                    var Style = `style="width:${WH < 50 ? 50 : WH}px;height:${titileHeight}px;line-height:${titileHeight}px;border-bottom: 1px solid #CCCCCC;"`
                    //渲染周
                    hourDiv += `<div class='ganttview-hzheader-week' ${Style}>${getday} ${'周' + weeks[i]} ${cellBack}</div>`
                }
            }
            hoursDiv.html(hourDiv)
            hoursDiv.css({ 'width': `${totalW}px`, 'height': `${titileHeight}px` });
            headerDiv.append(hoursDiv);
            div.append(headerDiv);
        },
        //创建网格[行]
        addGrid: function (div, months) {
            var rowDiv = Chart.createGrid(months);
            var gridDiv = jQuery("<div>", {
                "class": "ganttview-grid"
            });
            var unfoldConfigText = Chart.opts.unfoldConfig ? '展开' : '收起'
            var opts = Chart.opts;
            var cellWidth = opts.cellWidth;
            var data = Chart.opts.data;
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
            rowDiv.css("width", w + "px");
            gridDiv.css("width", w + "px");
            for (var i = 0; i < data.length; i++) { //行
                for (var j = 0; j < data[i].series.length; j++) { //列
                    if (data[i].series[j].serieslevel) { //类型超过三层
                        for (var k = 0; k < data[i].series[j].serieslevel.length; k++) {
                            var cloneDiv = rowDiv.clone();
                            cloneDiv.attr("id", "ganttview-grid-row-" + data[i].series[j].serieslevel[k].id);
                            cloneDiv.addClass("ganttview-grid-row-" + data[i].series[j].id);
                            cloneDiv.attr('data-lastChild',data[i].series[j].serieslevel[k].lastChild)
                            cloneDiv.attr('data-typeId',data[i].series[j].id)
                            cloneDiv.children().addClass("ganttview-grid-row-cell-" + data[i].series[j].serieslevel[k].id);
                            if(Chart.opts.unfoldConfig && k >= 2){ //默认收起/显示
                                cloneDiv.css({"display":"none"});
                            }
                            if(opts.isUnfold){ //超过第二层显示展开收起按钮
                                if(k == 1 && data[i].series[j].serieslevel.length > 2){
                                    cloneDiv.append(`<span class='unfold' data-type='${data[i].series[j].id}'><span>${unfoldConfigText}</span>(${data[i].series[j].serieslevel.length - 2})</span>`)
                                }
                            }
                            gridDiv.append(cloneDiv.clone());
                        }
                    } else {
                        var cloneDiv = rowDiv.clone();
                        cloneDiv.attr("id", "ganttview-grid-row-" + data[i].series[j].id);
                        cloneDiv.addClass("ganttview-grid-row-" + data[i].id);
                        cloneDiv.attr('data-lastChild',data[i].series[j].lastChild)
                        cloneDiv.attr('data-typeId',data[i].id)
                        cloneDiv.children().addClass("ganttview-grid-row-cell-" + data[i].series[j].id);
                        if(Chart.opts.unfoldConfig && j >= 2){ //默认收起/显示
                            cloneDiv.css({"display":"none"});
                        }
                        if(j == 1 && data[i].series.length > 2){
                            if(opts.isUnfold){ //超过第二层显示展开收起按钮
                                if(k == 1){
                                    cloneDiv.append(`<span class='unfold' data-type='${data[i].id}'><span>${unfoldConfigText}</span>(${data[i].series.length - 2})</span>`)
                                }
                            }
                        }
                        gridDiv.append(cloneDiv.clone());
                    }
                }
            }
            div.append(gridDiv);
        },
        //添加任务 条状外盒
        addBlockContainers: function (div) {
            var opts = Chart.opts;
            var data = opts.data;
            var showDayOfWeek = opts.showDayOfWeek;
            var w = 0
            if (Chart.opts.ganttScale == 'hours') {
                w = 0
            } else if (Chart.opts.ganttScale == 'months') {
                w = 0
            }
            var blocksDiv = jQuery("<div>", {
                "class": "ganttview-blocks",
                "css": {
                    "margin-top": w + "px"
                }
            });
            if (showDayOfWeek) {
                blocksDiv.addClass("ganttview-with-day-of-week")
            };
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    if (data[i].series[j].serieslevel) { //类型超过三层
                        for (var k = 0; k < data[i].series[j].serieslevel.length; k++) {
                            containerDiv = jQuery("<div>", {
                                "class": "ganttview-block-container ganttview-block-container-" + data[i].series[j].id,
                                "id": "ganttview-block-container-" + data[i].series[j].serieslevel[k].id
                            });
                            containerDiv.css("height", opts.cellHeight - 3 + "px");
                            if(Chart.opts.unfoldConfig && k >= 2){ //默认收起/显示
                                containerDiv.css({
                                    "height":opts.cellHeight - 3 + "px",
                                    "display":"none",
                                });
                            }
                            containerDiv.attr("data-typeId", data[i].series[j].id);
                            blocksDiv.append(containerDiv);
                        }
                    } else {
                        containerDiv = jQuery("<div>", {
                            "class": "ganttview-block-container ganttview-block-container-" + data[i].id,
                            "id": "ganttview-block-container-" + data[i].series[j].id
                        });
                        containerDiv.css("height", opts.cellHeight - 3 + "px");
                        if(Chart.opts.unfoldConfig && j >= 2){ //默认收起/显示
                            containerDiv.css({
                                "height":opts.cellHeight - 3 + "px",
                                "display":"none",
                            });
                        }
                        containerDiv.attr("data-typeId", data[i].id);
                        blocksDiv.append(containerDiv);
                    }
                }
            }
            div.append(blocksDiv);
        },
        setBlockContainersWidth: function (div) {
            var opts = Chart.opts;
            var data = opts.data;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    if (data[i].series[j].serieslevel) { //类型超过三层
                        for (var k = 0; k < data[i].series[j].serieslevel.length; k++) {
                            var gridDiv = jQuery("div#ganttview-grid-row-" + data[i].series[j].serieslevel[k].id, div);
                            jQuery("div.ganttview-block-container", div).css("width", gridDiv.css("width"));
                        }
                    } else {
                        var gridDiv = jQuery("div#ganttview-grid-row-" + data[i].series[j].id, div);
                        jQuery("div.ganttview-block-container", div).css("width", gridDiv.css("width"));
                    }
                }
            }
        },
        addBlocks: function (div) {
            var opts = Chart.opts;
            var data = opts.data;
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
            var rowIdx = 0;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    if (data[i].series[j].serieslevel) { //类型超过三层
                        for (var k = 0; k < data[i].series[j].serieslevel.length; k++) {
                            var series = data[i].series[j].serieslevel[k];
                            Chart.createBlock(i, series, rows, rowIdx, opts);
                            rowIdx++;
                        }
                    } else {
                        var series = data[i].series[j];
                        Chart.createBlock(i, series, rows, rowIdx, opts);
                        rowIdx++;
                    }
                }
            }
        },
        applyLastClass: function (div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
        },
        setCount: function (obj, start, end) {
            var opts = Chart.opts;
            var weekends = 0;
            var seriesName = obj.data('block-data').seriesName;
            var count = DateUtils.daysBetween(start, end, false, false);
            var text = obj.data('block-data').text;
            var excludeWeekends = opts.excludeWeekends;
            var showWeekends = opts.showWeekends;
            var excludeHolidays = opts.excludeHolidays;
            if (excludeWeekends && showWeekends) {
                weekends = DateUtils.daysBetween(start, end, true, false);
            }
            if (excludeHolidays) {
                weekends += DateUtils.daysBetween(start, end, null, true);
            }
            count -= weekends;
            obj.data('block-data').count = count;
            if (!text || (text && text == null)) {
                obj.children('.ganttview-block-text').text(count);
            }
            obj.attr("title", Utils.getTitle(seriesName, count));
        },
        //创建网格[列 hours = 24格子]
        createGrid: function (months) {
            var opts = Chart.opts;
            var data = opts.data;
            var cellWidth = opts.cellWidth;
            var cellHeight = opts.cellHeight;
            var showWeekends = opts.showWeekends;
            var showHolidays = opts.showHolidays;
            var showLine = opts.showLine
            var getMinutes = (new Date().getMinutes() / 60) * 100
            var rowDiv = jQuery("<div>", {
                "class": "ganttview-grid-row"
            });
            if (Chart.opts.ganttScale == 'hours') {
                for (var i = 0; i < 24; i++) {
                    if (months[i]) {
                        var cellDiv = jQuery("<div>", {
                            "class": "ganttview-grid-row-cell",
                            "css": {
                                "width": cellWidth - 1 + "px",
                                "height": cellHeight + "px",
                            }
                        })
                        var cellDate = months[i];
                        if (showLine) { //显示时间线
                            var cellline = jQuery("<div>", {
                                "class": "ganttview-grid-row-cell-line",
                                "css": {
                                    "width": `${getMinutes}%`,
                                }
                            });
                            if (DateUtils.isShowline(cellDate)) {
                                cellDiv.append(cellline.clone())
                            };
                            if (DateUtils.isShowlineBefore(cellDate)) {
                                cellDiv.addClass('ganttview-hzcontent-hour-before')
                            }
                        }
                        rowDiv.append(cellDiv.clone());
                    } else {
                        break;
                    }
                }
            } else if (Chart.opts.ganttScale == 'months') {
                for (var i = 0; i < 12; i++) {
                    if (months[i]) {
                        for (var j = 0; j < months[i].length; j++) {
                            var cellDiv = jQuery("<div>", {
                                "class": "ganttview-grid-row-cell",
                                "css": {
                                    "width": cellWidth - 1 + "px",
                                    "height": cellHeight + "px"
                                }
                            });
                            var cellDate = months[i][j];
                            if ((DateUtils.isWeekend(cellDate) && showWeekends) || !DateUtils.isWeekend(cellDate)) {
                                if (DateUtils.isWeekend(cellDate)) {
                                    cellDiv.addClass("ganttview-weekend")
                                };
                                if (DateUtils.isSaturday(cellDate)) {
                                    cellDiv.addClass("ganttview-saturday")
                                };
                                if (DateUtils.isSunday(cellDate)) {
                                    cellDiv.addClass("ganttview-sunday")
                                };
                                if (showHolidays) {
                                    for (var h in Holidays) {
                                        var holiday = Holidays[h];
                                        if (holiday.at.getTime() == Date.parse(cellDate).getTime()) {
                                            cellDiv.addClass("ganttview-holiday");
                                            if (holiday.color) {
                                                cellDiv.css("color", holiday.color);
                                            }
                                            if (holiday.backgroundColor) {
                                                cellDiv.css("background-color", holiday.backgroundColor);
                                            }
                                            break;
                                        }
                                    }
                                }
                                rowDiv.append(cellDiv.clone());
                            }
                        }
                    } else {
                        break;
                    }
                }
            } else if (Chart.opts.ganttScale == 'weeks') {
                for (var i = 0; i < 7; i++) {
                    if (months[i]) {
                        var cellDiv = jQuery("<div>", {
                            "class": "ganttview-grid-row-cell",
                            "css": {
                                "width": cellWidth - 1 + "px",
                                "height": cellHeight + "px",
                            }
                        });
                        rowDiv.append(cellDiv.clone());
                    } else {
                        break;
                    }
                }
            }
            return rowDiv;
        },
        //创建任务条 及相应事件
        createBlock: function (itemIdx, series, rows, rowIdx, opts) {
            var data = opts.data;
            var start = opts.start;
            var end = opts.end;
            var cellWidth = opts.cellWidth;
            var excludeWeekends = opts.excludeWeekends;
            var showWeekends = opts.showWeekends;
            var excludeHolidays = opts.excludeHolidays;
            var changed = opts.changed;
            var clicked = opts.clicked;
            var dblClicked = opts.dblClicked;
            var cellHeight = opts.cellHeight;
            var size = DateUtils.daysBetween(series.start, series.end, false, false);
            if (!showWeekends) {
                size -= DateUtils.daysBetween(series.start, series.end, true, false);
            }
            if (size && size > 0) {
                if (size > 365) {
                    size = 365;
                }
                var count = size;
                if (excludeWeekends && showWeekends) { //只有周六
                    count -= DateUtils.daysBetween(series.start, series.end, true, false);
                }
                if (excludeHolidays) { //排除节假日
                    count -= DateUtils.daysBetween(series.start, series.end, null, true);
                }
                var offset = DateUtils.daysBetween(start, series.start, false, false); //计算距离左侧格子数量
                if (!showWeekends) { //排除周末
                    offset -= DateUtils.daysBetween(start, series.start, true, false);
                }
                if (Chart.opts.ganttScale == 'hours') { //小时 计算任务位置
                    offset = DateUtils.daysBetween(series.start, series.end, false, false, 'hours', 'leftCount');
                    size = DateUtils.daysBetween(series.start, series.end, false, false, 'hours', 'WCount');
                } else if (Chart.opts.ganttScale == 'weeks') {//周 计算任务位置
                    offset = DateUtils.daysBetween(series.start, series.end, false, false, 'weeks', 'leftCount');
                    size = DateUtils.daysBetween(series.start, series.end, false, false, 'weeks', 'WCount');
                }
                var readOnly = series.readOnly ? series.readOnly : false;
                //任务条 添加样式
                let color = ''
                let colorText = ''
                let colorValue = ''
                switch (series.state) {
                    case 0:
                        colorText = 'blue'
                        colorValue = '#6EA8DC'
                        color = 'ganttview-block-text-blue';
                        break;
                    case 1:
                        colorText = 'yellow'
                        colorValue = '#FC8495'
                        color = 'ganttview-block-text-yellow';
                        break;
                    case 2:
                        colorText = 'green'
                        colorValue = '#6DE8C7'
                        color = 'ganttview-block-text-green';
                        break;
                    case 3:
                        colorText = 'gray'
                        colorValue = '#bfbebe'
                        color = 'ganttview-block-text-gray';
                        break;
                    default:
                        colorText = 'gray'
                        colorValue = '#bfbebe'
                        color = 'ganttview-block-text-gray';
                        break;
                }
                var blockDiv = jQuery("<div>", {
                    "id": "ganttview-block-" + series.id,
                    "class": `ganttview-block ${color}`,
                    "title": Utils.getTitle(series.name, count),
                    "css": {
                        "width": ((size * cellWidth) - 2) + "px",
                        "margin-left": ((offset * cellWidth)) + "px",
                        "left": "0px",
                        "height": cellHeight - 15 + "px",
                        "margin-top": parseInt((cellHeight - (cellHeight - 15)) / 2) - 2 + "px"
                    }
                }).data("block-data", {
                    itemId: data[itemIdx].id,
                    itemName: data[itemIdx].name,
                    seriesId: series.id,
                    seriesName: series.name,
                    start: Date.parse(series.start),
                    end: Date.parse(series.end),
                    color: series.color,
                    text: series.text,
                    count: count
                }).dblclick(function () {
                    if (Chart.selectedBlock != null && Chart.selectedBlock.data('block-data').seriesId == $(this).data('block-data').seriesId) {
                        var selItemRowId = Chart.selectedBlock.data('block-data').itemId;
                        var selRowId = Chart.selectedBlock.data('block-data').seriesId;
                        Chart.selectedBlock.removeClass("ganttview-block-selected");
                        jQuery("div#ganttview-vtheader-item-name-" + selItemRowId).removeClass("ganttview-vtheader-item-name-selected");
                        jQuery("div.ganttview-grid-row-cell-" + selRowId).removeClass("ganttview-grid-row-cell-selected");
                        jQuery("div#ganttview-vtheader-series-name-" + selRowId).removeClass("ganttview-vtheader-series-name-selected");
                        Chart.selectedBlock = null;
                    }
                    if (dblClicked != null) {
                        dblClicked($(this));
                    }
                }).click(function () {
                    if (Chart.selectedBlock != null && Chart.selectedBlock.data('block-data').seriesId != $(this).data('block-data').seriesId) {
                        var selItemRowId = Chart.selectedBlock.data('block-data').itemId;
                        var selRowId = Chart.selectedBlock.data('block-data').seriesId;
                        Chart.selectedBlock.removeClass("ganttview-block-selected");
                        jQuery("div#ganttview-vtheader-item-name-" + selItemRowId).removeClass("ganttview-vtheader-item-name-selected");
                        jQuery("div.ganttview-grid-row-cell-" + selRowId).removeClass("ganttview-grid-row-cell-selected");
                        jQuery("div#ganttview-vtheader-series-name-" + selRowId).removeClass("ganttview-vtheader-series-name-selected");
                        Chart.selectedBlock = null;
                    }
                    if (Chart.selectedBlock == null || Chart.selectedBlock.data('block-data').seriesId != $(this).data('block-data').seriesId) {
                        var curItemRowId = $(this).data('block-data').itemId;
                        var curRowId = $(this).data('block-data').seriesId;
                        $(this).addClass("ganttview-block-selected");
                        // jQuery("div#ganttview-vtheader-item-name-" + curItemRowId).addClass("ganttview-vtheader-item-name-selected");
                        jQuery("div.ganttview-grid-row-cell-" + curRowId).addClass("ganttview-grid-row-cell-selected");
                        // jQuery("div#ganttview-vtheader-series-name-" + curRowId).addClass("ganttview-vtheader-series-name-selected");
                        Chart.selectedBlock = $(this);
                    }
                    if (clicked != null) {
                        clicked($(this));
                    }
                }).draggable({
                    disabled: readOnly,
                    axis: 'x',
                    containment: 'parent',
                    grid: [cellWidth, 0],
                    stop: function (event, ui) {
                        var distance = (ui.position.left) / cellWidth;
                        var s = $(this).data('block-data').start.addDays(distance);
                        var e = $(this).data('block-data').end.addDays(distance);
                        var n = DateUtils.daysBetween(start, s, false, false) * cellWidth + 3;
                        $(this).css("margin-left", n + "px");
                        $(this).css("left", "0px");
                        Chart.setCount($(this), s, e);
                        if (changed != null) {
                            changed($(this));
                        }
                    }
                }).resizable({
                    disabled: readOnly,
                    containment: 'parent',
                    grid: [cellWidth, 0],
                    handles: 'e',
                    resize: function (event, ui) {
                        $(this).css("position", "");
                        $(this).css("top", "");
                        $(this).css("left", "0px");
                    },
                    stop: function (event, ui) {
                        var rdistance = Math.ceil(ui.size.width / cellWidth);
                        var s = $(this).data('block-data').start;
                        var e = $(this).data('block-data').end;
                        var prevCount = DateUtils.daysBetween(s, e, false, false);
                        e.addDays(rdistance - prevCount);
                        $(this).css("position", "");
                        $(this).css("top", "");
                        $(this).css("left", "0px");
                        ui.position.left = 0;
                        Chart.setCount($(this), s, e);
                        if (changed != null) {
                            changed($(this));
                        }
                    }
                })
                //修改甘特图样式
                Chart.forgeStyle(blockDiv, series, opts, colorText, colorValue, offset, size)
                if (series.color) {
                    blockDiv.css("background-color", series.color);
                }
                if (readOnly) {
                    blockDiv.addClass("ganttview-readOnly");
                }
                // if (series.text && series.text != null) {
                //     blockDiv.append($("<div>", {
                //         "id": "ganttview-block-text-" + series.id,
                //         "class": "ganttview-block-text"
                //     }).text(series.text));
                // } else {
                //     var weekends = 0;
                //     if (excludeWeekends && showWeekends) {
                //         weekends = DateUtils.daysBetween(series.start, series.end, true, false);
                //     }
                //     if (excludeHolidays) {
                //         weekends += DateUtils.daysBetween(series.start, series.end, null, true);
                //     }
                //     blockDiv.append($("<div>", {
                //         "id": "ganttview-block-text-" + series.id,
                //         "class": "ganttview-block-text"
                //     }).text(size - weekends));
                // }
                jQuery(rows[rowIdx]).append(blockDiv);
            }
        },
        /**
         * 修改甘特图样式
         * blockDiv: 任务条状
         * series: 数据来源
         * opts: 默认参数
         * colorText: 状态颜色
         * colorValue: 状态颜色
         * offset: 任务距离左侧距离
         * size: 任务所占宽度
         */
        forgeStyle: function (blockDiv, series, opts, colorText, colorValue, offset, size) {
            
            //添加进度区域*********************************
            if (series.schedule && series.schedule != null && series.schedule > 0) {
                blockDiv.append(`
                    <span class="ganttview-block-schedule ganttview-block-schedule-${colorText}">${series.schedule}%</span>
                `)
                let style = `style = "width:${series.schedule}%;border-bottom:2px solid ${colorValue}"`
                blockDiv.append(`
                    <span class="ganttview-block-schedule-line" ${style}></span>
                `)
            }
            //添加图标区域*********************************
            let cycleBox = ''
            let delayBox = ''
            let approveBox = ''
            let privateBox = ''
            let starBox = ''
            let iconCount = 0
            //添加星级图标
            if (series.star && series.star != null && series.star > 0) {
                let openDate = ''
                for (var i = 0; i < series.star; i++) {
                    iconCount = iconCount + 1
                    openDate += `<i></i>`
                }
                starBox = `<span class="ganttview-block-icon ganttview-block-star">${openDate}</span>`
            }
            //添加循环标识
            if (series.cycle && series.cycle != null && series.cycle == 1) {
                iconCount = iconCount + 1
                cycleBox = `<span class="ganttview-block-icon ganttview-block-cycle">循</span>`
            }
            //添加延迟标识
            if (series.delay && series.delay != null && series.delay == 1) {
                iconCount = iconCount + 1
                delayBox = `<span class="ganttview-block-icon ganttview-block-delay">延</span>`
            }
            //添加审批标识
            if (series.approve && series.approve != null && series.approve == 1) {
                iconCount = iconCount + 1
                approveBox = `<span class="ganttview-block-icon ganttview-block-approve">审</span>`
            }
            //添加私密标识
            if (series.private && series.private != null && series.private == 1) {
                iconCount = iconCount + 1
                privateBox = `<span class="ganttview-block-icon ganttview-block-private">私</span>`
            }
            let leftDistance = ''
            let leftDistance_0 = false
            let rightDistance_0 = false
            leftDistance = `style = left:${-(iconCount * 22)}px`
            //左侧显示图标距离位置不够
            if(Chart.opts.ganttScale == 'weeks'){ //时间周
                if(offset <= 1){ //任务靠左侧 周日
                    if(size >= 3){ //图标居中
                        leftDistance = `style = left:5px`
                        leftDistance_0 = true
                    }else{ //居右
                        leftDistance = `style = width:${(iconCount * 22)}px;left:100%`
                        rightDistance_0 = true
                    }
                }
            }else if(Chart.opts.ganttScale == 'hours'){ //时间小时
                if(offset <= 3){//任务靠左侧 3.00之前
                    if(size >= 8){ //图标居中
                        leftDistance = `style = left:5px`
                        leftDistance_0 = true
                    }else{ //居右
                        leftDistance = `style = width:${(iconCount * 22)}px;left:100%`
                        rightDistance_0 = true
                    }
                }
            }
            blockDiv.append(`
                <div class='gattview-icon-box' ${leftDistance}>${starBox} ${cycleBox} ${delayBox} ${approveBox} ${privateBox}</div>
            `)

            //添加文本区域*********************************
            //添加文本内容
            var cellHeight = opts.cellHeight;
            if (series.text && series.text != null) {
                let style = ''
                let styleMg = ''
                if (size <= 2 && Chart.opts.ganttScale == 'hours') {
                    if (offset >= 20) { //时间格式为小时且大于20:00 文字靠最左侧
                        styleMg = 'ganttview-block-text-left'
                    }
                    if(rightDistance_0){ //图标居右
                        style = `style ="
                        line-height:${cellHeight - 15}px;
                        margin-left:100%;
                        left:${iconCount * 22}px;
                        width: initial;
                        max-width: 200px;"`
                    }else{
                        style = `style ="
                        line-height:${cellHeight - 15}px;
                        margin-left:100%;
                        width: initial;
                        max-width: 200px;"`
                    }
                } else if (size <= 1 && Chart.opts.ganttScale == 'weeks') {
                    if (offset >= 5) { //时间格式为周且大于周五 文字靠最左侧
                        styleMg = 'ganttview-block-text-left'
                    }
                    if(rightDistance_0){ //图标居右
                        style = `style ="
                        line-height:${cellHeight - 15}px;
                        margin-left:100%;
                        left:${iconCount * 22}px;
                        width: initial;
                        max-width: 200px;"`
                    }else{
                        style = `style ="
                        line-height:${cellHeight - 15}px;
                        margin-left:100%;
                        width: initial;
                        max-width: 200px;"`
                    }
                } else {
                    style = `style ="line-height:${cellHeight - 15}px"`
                }
                if(leftDistance_0){ //图标文字居中 图标在任务左侧
                    style = `style ="line-height:${cellHeight - 15}px;left:${iconCount * 22}px"`
                }
                blockDiv.append(`
                    <div class="ganttview-block-text ${styleMg}" ${style}>${series.text}</div>
                `)
            }
        },
        //
        addSeries: function (d, s, itemIdx, mergedPoint, newPoint) {
            var div = jQuery("div.ganttview-slide-container");
            var vtheaderItem = jQuery("div#ganttview-vtheader-item-name-" + d.id);
            var vtheaderSeries = jQuery("div.ganttview-vtheader-series-name-" + d.id);
            var gridDiv = jQuery("div.ganttview-grid div.ganttview-grid-row-" + d.id, div);
            var months = Chart.getMonths();
            var rowDiv = Chart.createGrid(months);
            var cellWidth = Chart.opts.cellWidth;
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
            rowDiv.css("width", w + "px");
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container-" + d.id, div);
            var newRow = jQuery("<div>", {
                "class": "ganttview-block-container ganttview-block-container-" + d.id,
                "id": "ganttview-block-container-" + s.id
            });
            newRow.css("height", Chart.opts.cellHeight - 3 + "px");
            newRow.css("width", w + "px");
            var newVTHeader = jQuery("<div>", {
                "class": "ganttview-vtheader-series-name ganttview-vtheader-series-name-" + d.id,
                "id": "ganttview-vtheader-series-name-" + s.id
            }).append(s.name);
            var m = vtheaderItem.css("height");
            m = (m != null) ? m.replace(/px/, "") : "0";
            var n = parseInt(m) + Chart.opts.cellHeight;
            vtheaderItem.css("height", n + "px");
            if (vtheaderSeries.length == 0) {
                if (newPoint == null) {
                    vtheaderItem.next().append(newVTHeader);
                } else {
                    vtheaderSeries = jQuery("div#ganttview-vtheader-item-name-" + newPoint);
                    vtheaderSeries.next().append(newVTHeader);
                }
            } else {
                if (mergedPoint != null) {
                    vtheaderSeries = jQuery("div#ganttview-vtheader-series-name-" + mergedPoint);
                }
                vtheaderSeries.last().after(newVTHeader);
            }
            var cloneDiv = rowDiv.clone();
            cloneDiv.attr("id", "ganttview-grid-row-" + s.id);
            cloneDiv.addClass("ganttview-grid-row-" + d.id);
            cloneDiv.children().addClass("ganttview-grid-row-cell-" + s.id);
            if (gridDiv.length == 0) {
                if (newPoint == null) {
                    jQuery("div.ganttview-grid").append(cloneDiv);
                } else {
                    gridDiv = jQuery("div#ganttview-grid-row-" + mergedPoint, div);
                    gridDiv.after(cloneDiv);
                }
            } else {
                if (mergedPoint != null) {
                    gridDiv = jQuery("div#ganttview-grid-row-" + mergedPoint, div);
                }
                gridDiv.last().after(cloneDiv);
            }
            var newRows = $.makeArray(newRow.clone());
            Chart.createBlock(itemIdx, s, newRows, 0, Chart.opts);
            if (rows.length == 0) {
                if (newPoint == null) {
                    jQuery("div.ganttview-blocks").append(newRows);
                } else {
                    rows = jQuery("div#ganttview-block-container-" + mergedPoint, div);
                    rows.after(newRows);
                }
            } else {
                if (mergedPoint != null) {
                    rows = jQuery("div#ganttview-block-container-" + mergedPoint, div);
                }
                rows.last().after(newRows);
            }
            s.merged = true;
        },
        //鼠标移入效果
        Hover: function () {
            jQuery("div.ganttview-grid-row-cell").mouseover(function () {
                if (Chart.opts.gridHoverL) {
                    $(this).addClass('ganttview-grid-row-cell-hover')
                    let indexcount = $(this).index()
                    $.each($('.ganttview-grid-row'), function (index, item) {
                        $(item).find('.ganttview-grid-row-cell').eq(indexcount).addClass('ganttview-grid-row-cell-hover')
                    })
                    $('.ganttview-hzheader-hour,.ganttview-hzheader-week ').eq(indexcount).addClass('ganttview-grid-row-cell-hover')
                }
                if (Chart.opts.gridHoverH) {
                    $(this).siblings().addClass('ganttview-grid-row-row-hover')
                }
            }).mouseout(function () {
                if (Chart.opts.gridHoverL) {
                    $(this).removeClass('ganttview-grid-row-cell-hover')
                    let indexcount = $(this).index()
                    $.each($('.ganttview-grid-row'), function (index, item) {
                        $(item).find('.ganttview-grid-row-cell').eq(indexcount).removeClass('ganttview-grid-row-cell-hover')
                    })
                    $('.ganttview-hzheader-hour,.ganttview-hzheader-week ').eq(indexcount).removeClass('ganttview-grid-row-cell-hover')
                }
                if (Chart.opts.gridHoverH) {
                    $(this).siblings().removeClass('ganttview-grid-row-row-hover')
                }
            })
        },
        //展开收起
        Unfold:function () {
            var opts = Chart.opts;
            var cellHeight = opts.cellHeight;
            let unfoldFun = (containerTask,Grid,vtheader) => {
                $.each(containerTask,function(index,item){
                    if(index > 1){
                       $(item).toggle()
                    }
                })
                $.each(vtheader,function(index,item){
                    if(index > 1){
                       $(item).toggle(100)
                    }
                })
                Grid.toggle(100)
            }
            $('.unfold').click(function(){
                $(this).find('span').text($(this).find('span').text() == '展开' ? '收起' : '展开')
                let typeId = $(this).attr('data-type')
                let containerTask = $(`.ganttview-block-container[data-typeId=${typeId}]`)
                let Grid = $(this).parent().nextAll(`[data-typeId=${typeId}]`)
                let vtheader = $(`.ganttview-vtheader-series-name[data-typeId=${typeId}]`)
                unfoldFun(containerTask,Grid,vtheader)
            })
   
        }
    };
    var Events = {
        bindBlockClick: function (div, callback) {
            $("div.ganttview-block").live("click",
                function () {
                    if (callback) {
                        callback($(this).data("block-data"));
                    }
                });
        }
    };
    var ArrayUtils = {
        contains: function (arr, obj) {
            var has = false;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == obj) {
                    has = true;
                }
            }
            return has;
        }
    };
    // 甘特图任务条时间计算 (count)
    var DateUtils = {
        daysBetween: function (start, end, excludeWeekends, holidayOnly, type, select) {
            if (!start || !end) {
                return 0;
            }
            start = Date.parse(start);
            end = Date.parse(end);
            if (start.getYear() == 1901 || end.getYear() == 8099) {
                return 0;
            }
            var count = 0,
                date = start.clone();
            if (type == 'hours') {
                let Sminutes = start.getMinutes() / 60
                let Wminutes = end.getMinutes() / 60
                if (select == 'leftCount') { //距离左侧距离
                    count = start.getHours() + Sminutes
                } else if (select == 'WCount') { //宽度
                    count = end.getHours() - start.getHours() - Sminutes + Wminutes
                }
            } else if (type == 'weeks') {
                let Shours = start.getHours() / 24
                if (select == 'leftCount') { //距离左侧距离
                    count = start.getDay() + Shours
                    if (start < Chart.opts.start) {
                        count = 0
                    }
                } else if (select == 'WCount') { //宽度
                    count = (end - start) / (1000 * 60 * 60 * 24)
                    if (start < Chart.opts.start) { //开始时间未在 周 范围内
                        count = ((end - start) / (1000 * 60 * 60 * 24)) - ((Chart.opts.start - start) / (1000 * 60 * 60 * 24))
                    } else if (end > Chart.opts.end && end.getDate() != Chart.opts.end.getDate()) { //结束时间未在 周 范围内
                        count = (Chart.opts.end - start) / (1000 * 60 * 60 * 24) + 1
                    }
                    //超出本周范围
                    if (start < Chart.opts.start && end > Chart.opts.end) {
                        count = 7
                    }
                }
            } else {
                while (date.compareTo(end) == -1) {
                    if (holidayOnly) { //是否排除节假日
                        for (var h in Holidays) {
                            if (Holidays[h].at.getTime() == date.getTime()) {
                                count = count + 1;
                                break;
                            }
                        }
                    } else if ((excludeWeekends && DateUtils.isWeekend(date)) || !excludeWeekends) {
                        count = count + 1;
                    }
                    date.addDays(1);
                }
            }
            return count;
        },
        isWeekend: function (date) {
            return date.getDay() % 6 == 0;
        },
        isSaturday: function (date) {
            return date.getDay() == 6;
        },
        isSunday: function (date) {
            return date.getDay() == 0;
        },
        //是否为当前小时
        isShowline: function (date) {
            return date == new Date().getHours();
        },
        //是否为当前小时之前
        isShowlineBefore: function (date) {
            return date < new Date().getHours();
        },
        //是否为当前日期
        isShowBack: function (data) {
            return (data.getFullYear() + '/' + data.getMonth() + '/' + data.getDate()) == (new Date().getFullYear() + '/' + new Date().getMonth() + '/' + new Date().getDate())
        }
    };
    var Utils = {
        getTitle: function (name, distance) {
            return name + ", " + distance + ChartLang.days;
        }
    };
    jQuery.fn.extend({
        // 更新甘特图
        refreshGanttData: function () {
            var opts = Chart.opts;
            var d = Chart.opts.data;
            var data = $(this).data('block-data');
            for (var h = 0; h < d.length; h++) {
                if (d[h].id == data.itemId) {
                    d[h].name = data.itemName;
                    for (var i = 0; i < d[h].series.length; i++) {
                        if (d[h].series[i].id == data.seriesId) {
                            d[h].series[i].name = data.seriesName;
                            d[h].series[i].start = data.start;
                            d[h].series[i].end = data.end;
                            d[h].series[i].text = data.text;
                            break;
                        }
                    }
                    break;
                }
            }
            jQuery("div#ganttview-vtheader-item-name-" + data.itemId).text(data.itemName);
            jQuery("div#ganttview-vtheader-series-name-" + data.seriesId).text(data.seriesName);
            var blockDiv = jQuery("div#ganttview-block-" + data.seriesId);
            var size = DateUtils.daysBetween(data.start, data.end, false, false);
            var offset = DateUtils.daysBetween(opts.start, data.start, false, false);
            blockDiv.css({
                "width": ((size * opts.cellWidth) - 9) + "px",
                "margin-left": ((offset * opts.cellWidth) + 3) + "px"
            });
            var weekends = 0;
            if (opts.excludeWeekends && opts.showWeekends) {
                weekends = DateUtils.daysBetween(data.start, data.end, true, false);
            }
            if (opts.excludeHolidays) {
                weekends += DateUtils.daysBetween(data.start, data.end, null, true);
            }
            data.count = size - weekends;
            blockDiv.attr("title", Utils.getTitle(data.seriesName, data.count));
            if (data.text && data.text != null) {
                jQuery("div#ganttview-block-text-" + data.seriesId).text(data.text);
            } else {
                jQuery("div#ganttview-block-text-" + data.seriesId).text(data.count);
            }
        },
        // 删除甘特图
        deleteGanttData: function (o) {
            var opts = Chart.opts;
            var data = opts.data;
            var deleted = false;
            var seriesDeleted = false;
            var iId = o.data('block-data').itemId;
            var sId = o.data('block-data').seriesId;
            for (var m = 0; m < data.length; m++) {
                for (var n = 0; n < data[m].series.length; n++) {
                    if (data[m].series[n].id == o.data('block-data').seriesId) {
                        data[m].series.splice(n, 1);
                        if (data[m].series.length == 0) {
                            data.splice(m, 1);
                            seriesDeleted = true;
                        }
                        deleted = true;
                        break;
                    }
                }
                if (deleted) {
                    break;
                }
            }
            if (deleted == false) {
                return;
            }
            jQuery("div#ganttview-grid-row-" + sId).remove();
            jQuery("div#ganttview-block-container-" + sId).remove();
            jQuery("div#ganttview-vtheader-series-name-" + sId).remove();
            if (seriesDeleted) {
                jQuery("div#ganttview-vtheader-item-" + iId).remove();
            } else {
                var itemDiv = jQuery("div#ganttview-vtheader-item-name-" + iId);
                itemDiv.removeClass("ganttview-vtheader-item-name-selected");
                var m = itemDiv.css("height").replace(/px/, "");
                var n = parseInt(m) - opts.cellHeight;
                itemDiv.css("height", n + "px");
            }
            Chart.selectedBlock = null;
        }
    });
    jQuery.extend(jQuery.fn.ganttView, {
        // 添加甘特图
        addData: function (d) {
            var data = Chart.opts.data;
            for (var h = 0; h < d.length; h++) {
                for (var i = 0; i < d[h].series.length; i++) {
                    d[h].series[i].merged = false;
                }
            }
            for (var h = 0; h < d.length; h++) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].id == d[h].id) {
                        if (Chart.selectedBlock == null) {
                            Chart.opts.data[i].series.push(d[h].series);
                        }
                        for (var j = 0; j < d[h].series.length; j++) {
                            if (Chart.selectedBlock == null) {
                                Chart.addSeries(d[h], d[h].series[j], i, null, null);
                            } else {
                                Chart.addSeries(d[h], d[h].series[j], i, Chart.selectedBlock.data('block-data').seriesId, null);
                            }
                        }
                        break;
                    }
                }
            }
            var header = jQuery("div.ganttview-vtheader");
            var newItem = jQuery("<div>", {
                "class": "ganttview-vtheader-item"
            });
            var newItemName = jQuery("<div>", {
                "class": "ganttview-vtheader-item-name"
            });
            var newSeries = jQuery("<div>", {
                "class": "ganttview-vtheader-series"
            });
            var newIdx = 0;
            if (Chart.selectedBlock != null) {
                for (var h = 0; h < data.length; h++) {
                    for (var i = 0; i < data[h].series.length; i++) {
                        if (Chart.selectedBlock.data('block-data').seriesId == data[h].series[i].id) {
                            var dataMerged = false;
                            for (var m = 0; m < d.length; m++) {
                                if (d[m].id == data[h].id) {
                                    var f = data[h].series.slice(0, i + 1);
                                    var g = data[h].series.slice(i + 1, data[h].series.length);
                                    $.merge(f, d[m].series);
                                    $.merge(f, g);
                                    delete data[h].series;
                                    Chart.opts.data[h].series = f;
                                    newIdx = h;
                                    dataMerged = true;
                                }
                            }
                            if (dataMerged == false) {
                                var f = data.slice(0, h + 1);
                                var g = data.slice(h + 1, data.length);
                                $.merge(f, d);
                                $.merge(f, g);
                                Chart.opts.data = f;
                                newIdx = h + 1;
                            }
                            break;
                        }
                    }
                }
            } else if (data.length == 0) {
                Chart.opts.data = d;
            }
            for (var h = 0; h < d.length; h++) {
                for (var i = 0; i < d[h].series.length; i++) {
                    if (d[h].series[i].merged == false) {
                        var cloneNewItem = newItem.clone();
                        cloneNewItem.attr("id", "ganttview-vtheader-item-" + d[h].id);
                        var cloneNewItemName = newItemName.clone();
                        cloneNewItemName.attr("id", "ganttview-vtheader-item-name-" + d[h].id);
                        cloneNewItemName.css("height", "0px");
                        cloneNewItemName.append(d[h].name);
                        cloneNewItem.append(cloneNewItemName);
                        cloneNewItem.append(newSeries.clone());
                        if (Chart.selectedBlock == null) {
                            Chart.opts.data.push(d[h]);
                            header.append(cloneNewItem);
                            Chart.addSeries(d[h], d[h].series[i], Chart.opts.data.length - 1, null, null);
                        } else {
                            header = jQuery("div#ganttview-vtheader-series-name-" + Chart.selectedBlock.data('block-data').seriesId).parent().parent();
                            header.after(cloneNewItem);
                            Chart.addSeries(d[h], d[h].series[i], newIdx, Chart.selectedBlock.data('block-data').seriesId, d[h].id);
                        }
                    }
                }
            }
        }
    });
})(jQuery);