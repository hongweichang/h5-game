/**
 * 翻牌小游戏
 * @type {Object}
 */
(function() {

    'use strict';


    //配置文件
    var config = {

        //图片
        images: {
            //正面图
            front: "images/1.png",
            //背景图,随机分配
            back: ["images/11.png", "images/12.png", "images/13.png"]
        },

        //翻转的速度单位ms //默认0.6秒
        speed: 600,

        //反转的反向
        //顺时针//逆时针 left or rigth
        direction: 'left'

    }


    var _cache = {};
    var _style = document.documentElement.style;
    function prefixStyle(attr) {
        var vendors = ['webkit', 'Moz', 'ms', 'o'];
        var name;
        if (_cache[attr]) {
            return _cache[attr];
        }
        if (attr in _style) {
            return _cache[attr] = attr;
        }
        //需要加前缀
        _.each(vendors, function(v) {
            if (jQuery.camelCase(v + '-' + attr) in _style) {
                name = '-' + v + '-' + attr;
                return _cache[attr] = name;
            }
        })
        return name;
    }
    var transform = prefixStyle('transform');
    var transitionend = 'transitionend webkitTransitionEnd MSTransitionEnd oTransitionEnd';


    function format(format) {
        var args = [].slice.call(arguments, 1, arguments.length);
        return format.replace(/\{(\d+)\}/g, function(m, i) {
            return args[i];
        });
    }


    config.rotateY = config.direction === 'left' ? '180deg' : '-180deg';


    //原始布局
    function calculateOrder(row, col) {
        var order = [];
        var i;
        var j;
        for (i = 0; i < col; i++) {
            for (j = 0; j < row; j++) {
                if (!order[i]) {
                    order[i] = [];
                }
                order[i].push(j)
            }
        }
        return order;
    }

    //随机布局
    function calculateRandom(originalOrder) {
        var randomOrder = [];
        var order;
        //计算随机
        var calculate = function(len) {
            return Math.floor(Math.random() * len);
        }
        for (var i = 0, len = originalOrder.length; i < len; i++) {
            randomOrder[i] = [];
            for (var j = 0, orderLen = originalOrder[i].length; j < orderLen; j++) {
                //随机数
                order = calculate(orderLen);
                //去重,保证唯一
                if (randomOrder[i].length > 0) {
                    while (jQuery.inArray(order, randomOrder[i]) > -1) {
                        order = calculate(orderLen)
                    }
                }
                randomOrder[i].push(order);
            }
        }
        return randomOrder;
    }



    var Manager = function(element, options) {

        //页面容器
        var $container = this.$container = $(element);

        //区域尺寸
        this.contentWidth = parseInt($container.css('width'))
        this.contentHeight = parseInt($container.css('Height'))

        //布局
        var level = this.level = {
            row: 3, //横行
            col: 2 //竖列
        }

        //触发翻转动画
        this.trigger = [];
        //布局的原始排序
        this.originalOrder = calculateOrder(level.row, level.col);
        //新是随机排序
        this.randomOrder = [];

        //创建
        this.initCreate();
        this.creatEvent();

        console.log(this)
    };


    Manager.prototype = {

        initCreate: function() {
            this.debrisWidth = this.contentWidth / this.level.row;
            this.debrisHeight = this.contentHeight / this.level.col;
            //随机
            this.randomOrder = calculateRandom(this.originalOrder);
            //布局
            this.initLayer();
        },


        initLayer: function() {
            var index;
            var $ul;
            var $li;
            var uls = [];
            var debrisWidth  = this.debrisWidth;
            var debrisHeight = this.debrisHeight;
            var row          = this.level.row;
            var col          = this.level.col;
            var images       = config.images;
            var randomOrder  = this.randomOrder;
            var uls          = [];

            var createStr = function(i, j) {
                var fill = function() {
                    return 'width:100%;height:100%;position:absolute;top:0;left:0;background-size:100% 100%;backface-visibility: hidden;'
                }
                var innerdiv = function() {
                    return format(
                        '<div style="{0};left;z-index:2;background-image:{1}"></div>' +
                        '<div style="{0};{4}:rotateY({2});background-image:{3};"></div>',
                        fill(),
                        "url('" + images.front + "')",
                        config.rotateY,
                        "url('" + images.back[randomOrder[i][j]] + "')",
                        transform
                    )
                }
                var str = format(
                    '<li data-col={0} data-row={1} ' +
                    'style="width:{2}px;height:{3}px;left:{4}px;top:{5}px;' +
                    'background-size:100% 100%;' +
                    'position:absolute;' +
                    '{6}-style: preserve-3d;' +
                    '{6}:scale(0.9);"' +
                    '>' + innerdiv() + '</li>',
                    i, j,
                    debrisWidth, debrisHeight, j * debrisWidth, i * debrisHeight,
                    transform
                )
                return $(str)
            }

            //生成 row * col 的矩阵
            for (var i = 0; i < col; i++) {
                $ul = $(document.createElement('ul')).css({
                    'width': this.contentWidth,
                    'height': this.contentHeight / 2
                });
                for (var j = 0; j < row; j++) {
                    $li = createStr(i, j);
                    $ul.append($li)
                    if (!this.originalOrder[i]) {
                        this.originalOrder[i] = [];
                    }
                    this.originalOrder[i].push(j)
                }
                uls.push($ul)
            }

            var $fragment = $(document.createElement('createDocumentFragment'));
            $.each(uls, function(index, ul) {
                $fragment.append(ul)
            })
            this.$container.append($fragment[0].childNodes);
        },

        getPos: function(element) {
            return {
                'col' : parseInt(element.getAttribute('data-col')),
                'row' : parseInt(element.getAttribute('data-row'))
            }
        },

        target: function(event) {
            var element;
            var nodeName = function(element) {
                var elementName = element.nodeName.toLowerCase();
                if (elementName == 'li') {
                    return element;
                }
            }
            if (element = event.target) {
                return nodeName(element) || nodeName(element.parentNode) 
            }
        },

        onClick: function(event) {
            console.log( this.trigger)
            var element;
            if (element = this.target(event)) {
                $(element).css({
                    'transition-duration': config.speed + 'ms',
                    transform: 'rotateY(' + config.rotateY + '),scale(0.9)'
                })
                var pos = this.getPos(element);
                console.log(element,pos)
                this.trigger.push(element);
            }
        },

        transitionend: function(e) {
            var element;
            if (element = this.target(event)) {
                var page = element.getAttribute('data-page');
                var index = element.getAttribute('data-index');

            }
        },

        creatEvent: function() {
            var stopBehavior = function(event) {
                event.preventDefault();
                event.stopPropagation();
            }
            var self = this;
            this.$container.on('mousedown touchstart', function(event) {
                stopBehavior(event)
                self.onClick(event)
            }).on(transitionend, function(event) {
                self.transitionend(event)
            });
        }
    }

    window['cardGames'] = Manager;
})();
