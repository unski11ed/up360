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

    resourceUrl: "http://localhost:8000/chunks/scene/{index}_{column}_{row}_{totalColumns}_{totalRows}_{resX}_{resY}.jpg",

    levelObjects: [
        {
            zoomThreshold: 1,
            width: 390,
            height: 311,
            columns: 1,
            rows: 1
        },
        {
            zoomThreshold: 2,
            width: 780,
            height: 622,
            columns: 2,
            rows: 2
        },
        {
            zoomThreshold: 4,
            width: 1560,
            height: 1246,
            columns: 4,
            rows: 4
        },
        {
            zoomThreshold: 8,
            width: 3121,
            height: 2494,
            columns: 8,
            rows: 8
        }
    ]
});