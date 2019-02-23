import * as UI from './ui/index';

import { Functions } from './helpers';
import { Engine } from './engine';
import defaults from './defaults';

export default function up360(element, options) {
    var parentContainer,
        rootElement,
        settings,
        engine,
        lastNormalizedZoomValue = 0;

    //Set the parent container
    if (element instanceof HTMLElement)
        parentContainer = element;
    else if (typeof element === 'string')
        parentContainer = document.querySelector(element);
    else
        throw 'up360: Invalid container element provided.';

    rootElement = document.createElement('div');
    rootElement.classList.add('up360');
    parentContainer.appendChild(rootElement);

    settings = Functions.extend(defaults, options);
    engine = new Engine(rootElement, settings);

    var animation = new UI.Animation(engine, settings.maxFrame, settings);
    var ui = new UI.Menu(rootElement);
    var previewWindow = new UI.PreviewWindow(rootElement, animation, engine, settings.previewWindow);
    var preLoader = new UI.Loader(rootElement);
    var fullscreen = new UI.FullScreen(rootElement, engine);
    var gestures = new UI.Gestures(engine, settings);
    var inputManager = new UI.InputManager(rootElement, engine, gestures, animation, settings);

    //Modules event glue
    settings.onInitComplete.Add(function () {
        if (settings.DOMSettings.buildUI)
            ui.Init();

        if (settings.DOMSettings.buildPreviewWindow)
            previewWindow.Init();

        inputManager.Init();

        preLoader.Hide();

        engine.UpdateSize();
        previewWindow.UpdateSize();
    });

    settings.onZoomChanged.Add(function (normalizedZoom) {
        ui.SetZoomBarValue(normalizedZoom);
        previewWindow.UpdateSize();

        if (normalizedZoom == 0) {
            engine.CenterContent();
            previewWindow.Hide();

            ui.SetMode('rotate');
            gestures.PanRotate.Set('rotate');
        } else {
            if (lastNormalizedZoomValue === 0) {
                ui.SetMode('move');
                gestures.PanRotate.Set('move');
            }
            previewWindow.Show();
        }

        lastNormalizedZoomValue = normalizedZoom;
    });

    settings.onLowResFrameLoaded.Add(function (frame, total) {
        preLoader.Update(frame / total * 100);
    });

    settings.onContentMoved.Add(function (x, y) {
        previewWindow.UpdatePosition();
    });

    settings.onDrawFrame.Add(function (frameIndex, isHighRes, url) {
        previewWindow.UpdateFrame(url);
    });

    ui.OnFullScreenChanged.Add(function () {
        animation.Stop();
        ui.SetPlay('play');

        fullscreen.Toggle();
    });

    ui.OnModeChanged.Add(function (mode) {
        gestures.Set(mode);
    });

    ui.OnPlayChanged.Add(function (command) {
        if (command === 'play')
            animation.Play();
        else
            animation.Stop();
    });

    ui.OnZoomBarChanged.Add(function (value) {
        engine.Zoom({ normalized: value });
    });

    //animation events
    animation.OnStopped.Add(function () {
        ui.SetPlay('play');
    });

    animation.OnStarted.Add(function () {
        ui.SetPlay('stop');
    });


    var interfaceObject = {
        Init: function () {
            if (settings.DOMSettings.buildLoadingScreen)
                preLoader.Init();
            preLoader.Show();

            engine.Init();
        },
        Zoom: engine.Zoom,
        Draw: engine.Draw,
        SwitchFrame: engine.SwitchFrame,
        Move: engine.Move,

        Play: animation.Play,
        Stop: animation.Stop,

        ContentPosition: engine.GetContentPosition,

        SwitchMode: gestures.Set,    // pan || move

        Dispose: function () {
            animation.Stop();
            fullscreen.Dispose();
            previewWindow.Dispose();
            ui.Dispose();
            preLoader.Dispose();
            element.removeChild(parentContainer);
        }
    };

    if (settings.autoinit) {
        interfaceObject.Init();
    }

    return interfaceObject;
};
