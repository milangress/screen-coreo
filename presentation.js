const defaultAnimation = {
    duration: 1000,
    steps: '10',
    onUpdate: (progress) => {
        console.log(`Animation progress: ${progress * 100}%`);
    }
}

startPresentation(bg)

const bg = Scene(() => {
    return Window('bg')
    .size(100, 100)
    .position(0, 0)
    .zIndex(-1)
    .content(
       Layer.Video('test.mp4')
    )
    .on('SPACE').NextScene(scene2)
});

const scene1 = Scene(() => {
    return Window('riverBank')
    .size(35, 80)
    .position(10, 20)
    .zIndex(0)
    .content(
        Layer.Text('on the wrong side of the river bank'),
        Layer.Image('/land1.gif')
    )
    //the window should close itself before launching the next scene
    .on('CLICK').close().NextScene(sceneAnimateRiver)
});

const sceneAnimateRiver = Scene(() => {
    const river = windowManager.getWindow('riverBank');
    if (river) {
        river
            .animate({
                position: [50, 50],
                size: [20, 20]
            }, defaultAnimation)
            .then(() => {
                river.close().NextScene(scene2)
            })
    }
});

const scene2 = Scene(() => {
    return Window
    .size(35, 35)
    .position(50, 50)
    .zIndex(0)
    .content(
        Layer.Text('I had corona last week and Im feeling quite melancholic right now.'),
        Layer.Image('/waves.gif')
    )
    .on('CLICK').close().NextScene(scene3)
});

const scene3 = Scene(() => {
    const initialState = Window
        .size(35, 20)
        .position(50, 20)
        .zIndex(0);

    const animateTo = Window
        .position(100, 20)

    return initialState
        .content(
            Layer.Text('This is an experiment… a collection of fragments strung together. working title: „on the wrong side of the river bank"')
        )
        .on('SPACE')
        .animate(animateTo, defaultAnimation)
        .then(() => {
            console.log('Animation completed');
        })
        .close()
        .NextScene(gridScene);
});

const gridScene = Scene(() => {
    const gridSize = 5;
    const windowSize = 20; // Size in percentage of screen
    const windows = [];

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const window = Window
                .size(windowSize, windowSize)
                .position(col * windowSize, row * windowSize)
                .zIndex(1)
                .content(
                    Layer.Text(`Window ${row * gridSize + col + 1}`),
                    Layer.Image(`/image-${row}-${col}.jpg`).filter(Math.random())
                )
                .on('CLICK').do(() => {
                    console.log(`Clicked window at row ${row}, column ${col}`);
                });
            
            windows.push(window);
        }
    }

    return WindowComposition
        .addWindows(...windows)
        .on('SPACE').close().NextScene(nextScene);
});

// ... more scenes ...
