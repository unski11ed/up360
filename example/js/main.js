import up360 from './../../lib/js/main';
import './../../lib/sass/index.scss';

var targetElement = document.querySelector('.example-holder');
//TODO: Init fully
var up360Interface = up360(targetElement, {
    minZoom: 1,
    maxZoom: 8,

    minFrame: 1,
    maxFrame: 38,

    playSpeed: 80,
    defaultPlayDirection: -1,
    rotationDivider: 10,

    baseLayoutsUrl: "http://upstrakt.pl/wp-content/themes/superior/360/css/templates/",

    levelObjects: [
        {
            zoomThreshold: 1,
            width: 390,
            height: 311,
            resourceUrl: "http://upstrakt.pl/wp-content/themes/superior/360/content/temida/390x311/{index}_0.jpg",
            columns: 1,
            rows: 1
        },
        {
            zoomThreshold: 2,
            width: 780,
            height: 622,
            resourceUrl: "http://upstrakt.pl/wp-content/themes/superior/360/content/temida/780x622/{index}_{offset}.jpg",
            columns: 2,
            rows: 2
        },
        {
            zoomThreshold: 4,
            width: 1560,
            height: 1246,
            resourceUrl: "http://upstrakt.pl/wp-content/themes/superior/360/content/temida/1560x1246/{index}_{offset}.jpg",
            columns: 4,
            rows: 4
        },
        {
            zoomThreshold: 8,
            width: 3121,
            height: 2494,
            resourceUrl: "http://upstrakt.pl/wp-content/themes/superior/360/content/temida/3121x2494/{index}_{offset}.jpg",
            columns: 8,
            rows: 8
        }
    ]
});