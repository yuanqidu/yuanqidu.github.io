---
layout: archive
title: ""
permalink: /publications/
author_profile: true
googlescholar: https://scholar.google.com/citations?user=fAc_zZMAAAAJ&hl=en
---

<h3 class="subtitle">Publications
(
    <a id="publication-by-selected" href="javascript:;", onClick="publicationBySelected();">show selected</a> /
    <a id="publication-by-date" href="javascript:;", onClick="publicationByDate();">show all by date</a> /
    <a id="publication-by-topic" href="javascript:;", onClick="publicationByTopic();">show all by topic</a>
)
</h3>
<p class="subtitle-aux"><b>Topics:</b>
    <a href="#generative-model" onClick="return publicationByTopicSpecific(this)" data-topic="generative-model">Generative Models</a> /
    <a href="#equivariant-neural-network" onClick="return publicationByTopicSpecific(this)" data-topic="equivariant-neural-network">Equivariant Neural Networks</a> /
    <a href="#control-sampling" onClick="return publicationByTopicSpecific(this)" data-topic="control-sampling">Stochatic Control & Sampling</a>
    <br />
</p>
<div id="pub-card-container" class="activated hide">
  <div class="pub-card" data-topic="control-sampling" data-year="2025" data-selected="true">
    <strong>Doob's Lagrangian: A Sample-Efficient Variational Approach to Transition Path Sampling</strong><br>
    <em><b>Yuanqi Du*</b>, Michael Plainer*, Rob Brekelmans*, Chenru Duan, Frank Noe, Carla P. Gomes, Alán Aspuru-Guzik, Kirill Neklyudov.</em><br>
    NeurIPS 2024 (<b>Spotlight</b>) | <a href="https://openreview.net/forum?id=ShJWT0n7kX">paper</a>
  </div>
  <br>

  <div class="pub-card" data-topic="control-sampling" data-year="2025" data-selected="true">
    <strong>Structure-based Drug Design with Equivariant Diffusion Models</strong><br>
    <em>Arne Schneuing*, Charles Harris*, <b>Yuanqi Du*</b>, Arian Jamasb, Ilia Igashov, Weitao Du, Carla P. Gomes, Tom Blundell, Pietro Lió, Max Welling, Michael Bronstein, Bruno Correia.</em><br>
    Nature Computational Science 2024 | <a href="https://www.nature.com/articles/s43588-024-00737-x">paper</a> 
  </div>

</div>


<script src="https://code.jquery.com/jquery-3.1.1.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js"
        integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js"
        integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>
<script type="text/javascript" src="static/js/jquery.color.min.js"></script>
<script type="text/javascript">
function publicationBySelected() {
    var a = $("#publication-by-selected")
    if (a.hasClass("activated")) {
        return ;
    }

    $("#pub-container .subtitle a").removeClass("activated");
    $("#pub-container .subtitle-aux a").removeClass("activated");
    a.addClass("activated");

    $("#pub-card-container").html("");
    for (var pubId = 0; pubId < allPublications.length; pubId++) {
        var pub = $(allPublications[pubId]);
        if (pub.data("selected") == true) {
            $("#pub-card-container").append(pub);
        }
    }
}

function publicationByDate() {
    var a = $("#publication-by-date")
    if (a.hasClass("activated")) {
        return ;
    }

    $("#pub-container .subtitle a").removeClass("activated");
    $("#pub-container .subtitle-aux a").removeClass("activated");
    a.addClass("activated");

    $("#pub-card-container").html("");
    for (var pubId = 0; pubId < allPublications.length; pubId++) {
        if (pubId == 0 || $(allPublications[pubId-1]).data("year") != $(allPublications[pubId]).data("year")) {
            var year = $(allPublications[pubId]).data("year");
            $("#pub-card-container").append($("<h5 id='year-" + year.toString() + "'>" + year.toString() + "</h5>"));
        }
        $("#pub-card-container").append(allPublications[pubId]);
    }
}

function publicationByTopicInner() {
    var a = $("#publication-by-topic")
    if (a.hasClass("activated")) {
        return ;
    }
    $("#pub-container .subtitle a").removeClass("activated");
    a.addClass("activated");

    $("#pub-card-container").html("");
    for (var topicId in allTopics) {
        var topic = allTopics[topicId].name;
        var topicTitle = allTopics[topicId].title;
        // var topicTitle = topic.split("-").map(function (a) { return a[0].toUpperCase() + a.substr(1).toLowerCase(); }).join(" ");
        $("#pub-card-container").append($("<h5 id='topic-" + topic + "'>" + topicTitle + "</h5>"));
        for (var pubId = 0; pubId < allPublications.length; pubId++) {
            var pub = $(allPublications[pubId]);
            if (pub.data("topic").indexOf(topic) != -1) {
                $("#pub-card-container").append(pub);
            }
        }
    }
}

function publicationByTopicSpecificInner(a) {
    if ($(a).hasClass("activated")) {
        return false;
    }

    $("#pub-container .subtitle-aux a").removeClass("activated");
    $(a).addClass("activated");
}

function publicationByTopic() {
    publicationByTopicInner();
    publicationByTopicSpecificInner($("#pub-container .subtitle-aux a:first"));
    return true;
}

function publicationByTopicSpecific(a) {
    publicationByTopicInner();
    publicationByTopicSpecificInner(a);

    var hash = a.hash;
    $(hash).prop('id', hash.substr(1) + '-noscroll');
    window.location.hash = hash;
    $(hash + '-noscroll').prop('id', hash.substr(1));

    if (!$(hash).isInViewport()) {
        $('html, body').animate({
            scrollTop: $(hash).offset().top
        }, 1000, function(){
        });
    }

    return false;
}
</script>