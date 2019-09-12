import up360 from './../../lib/js/main';
import './../../lib/sass/index.scss';

var targetElement = document.querySelector('#wrap-example');

var up360Interface = up360(targetElement, {
    fillWindow: true,

    backgroundColor: '#34261b',
    primaryUiColor: '#555',
    secondaryUiColor: '#fff',

    minFrame: 0,
    maxFrame: 359,

    playSpeed: 40,
    defaultPlayDirection: -1,
    rotationDivider: 10,
    
    resourceUrl: "http://mkurban.me/up360-photos/guitars/{index}_{column}_{row}_{totalColumns}_{totalRows}_{resX}_{resY}.jpg",

    levelObjects: [
        {
            zoomThreshold: 1,
            width: 480,
            height: 270,
            columns: 1,
            rows: 1
        },
        {
            zoomThreshold: 2,
            width: 960,
            height: 540,
            columns: 2,
            rows: 2
        },
        {
            zoomThreshold: 3,
            width: 1920,
            height: 1080,
            columns: 4,
            rows: 4
        },
        {
            zoomThreshold: 4,
            width: 3840,
            height: 2160,
            columns: 8,
            rows: 8
        }
    ]
});