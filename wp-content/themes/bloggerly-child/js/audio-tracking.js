function initBeesayaAudioTracking() {

    const audioPlayers = document.querySelectorAll(
        ".wp-block-h5ap-audioplayer audio"
    );

    if (audioPlayers.length === 0) {
        return false;
    }

    audioPlayers.forEach(function(audio) {

        if (audio.dataset.beesayaTracked) {
            return;
        }

        audio.dataset.beesayaTracked = "true";

        audio.addEventListener("play", function() {

            gtag("event", "audio_play", {

                article_title: document.title,

                audio_duration:
                    Math.round(audio.duration)

            });

        });

    });

    return true;
}


document.addEventListener("DOMContentLoaded", function() {

    let attempts = 0;

    const checkAudio = setInterval(function() {

        attempts++;

        if (initBeesayaAudioTracking()) {

            clearInterval(checkAudio);

        }

        if (attempts >= 20) {

            clearInterval(checkAudio);

            console.log(
                "BeesayaTV audio player not found"
            );

        }

    }, 500);

});