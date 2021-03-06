
var max_profiles = 5;
var profile = window.localStorage.getItem('profile');
if (typeof profile === 'string' && profile.length > 0) {
    profile = parseInt(profile);
} else {
    profile = 1;
    window.localStorage.setItem('profile', profile);
}
var quick_scenes = [];

const obs = new OBSWebSocket();
obs.on('SwitchScenes', (data) => {
    $('#quick-scenes button[scene_name]').attr('selected', false);
    $('#quick-scenes button[scene_name="' + data.sceneName + '"]').attr('selected', true);
});
obs.on('ScenesChanged', (data) => {
    PopulateQuickScenes();
});

window.onload = function () {
    LoadProfile();

    var $profile_select = $("#profile");
    console.log(profile);
    $profile_select.on('change', (e) => {
        profile = parseInt(e.currentTarget.value);
        window.localStorage.setItem('profile', profile);
        LoadProfile();
    });
    for (var i = 1; i <= max_profiles; i++) {
        $profile_select.append($("<option/>", { value: i, text: "Profile " + i, selected:profile===i }));
    }
};

function LoadProfile() {
    var value = window.localStorage.getItem("quick-scenes-" + profile);
    if (typeof value === 'string' && value.length > 0) {
        quick_scenes = JSON.parse(value);
    } else {
        quick_scenes = [];
    }

    obs.connect().then(() => {
        PopulateQuickScenes();
    });
}

function EditScenes(enable) {
    $("#edit-scenes").css('display', (enable ? "" : "none"));
    if (enable) {
        obs.send('GetSceneList').then((data) => {
            var $list = $("#edit-scenes ul");
            $list.empty();
            for (var scene of data.scenes) {
                $list.append(
                    $("<li/>").append(
                        $("<input/>", { type: "checkbox" }).prop({ checked: quick_scenes.includes(scene.name), scene_name: scene.name }).change(() => {
                            if (event.target.checked) {
                                quick_scenes.push(event.target.scene_name);
                            } else {
                                var index = quick_scenes.indexOf(event.target.scene_name);
                                if (index > -1) {
                                    quick_scenes.splice(index, 1);
                                }
                            }
                        }),
                        scene.name
                    )
                );
            }
        });
    } else {
        window.localStorage.setItem("quick-scenes-"+profile, JSON.stringify(quick_scenes));
        PopulateQuickScenes();
    }
}

function PopulateQuickScenes() {
    obs.send('GetSceneList').then((data) => {
        var scene_names = [];
        for (var scene of data.scenes) {
            scene_names.push(scene.name);
        }

        var $quick_scenes = $("#quick-scenes");
        $quick_scenes.empty();
        for (var scene_name of quick_scenes) {
            if (scene_names.includes(scene_name)) {
                $quick_scenes.append($("<button/>", { scene_name: scene_name, selected: scene_name === data.currentScene }).on('click', SelectScene).append($("<span/>", { text: scene_name })));
            }
        }
    });
}

function SelectScene(e) {
    obs.send('SetCurrentScene', { 'scene-name': e.currentTarget.getAttribute('scene_name') });
}