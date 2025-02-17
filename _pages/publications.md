---
layout: archive
title: ""
permalink: /publications/
author_profile: true
googlescholar: https://scholar.google.com/citations?user=fAc_zZMAAAAJ&hl=en
---

<html>
<body>

<div class="content-container">
  <div id="pub-container">
    <h1 class="subtitle">Publications
    (
        <a id="publication-by-selected" href="javascript:;" onClick="publicationBySelected();">show selected</a> /
        <a id="publication-by-date" href="javascript:;" onClick="publicationByDate();">show all by date</a> /
        <a id="publication-by-topic" href="javascript:;" onClick="publicationByTopic();">show all by topic</a>
    )
    </h1>
    <p class="subtitle-aux"><b>Topics:</b>
        <a href="#generative-model" onClick="return publicationByTopicSpecific(this)" data-topic="generative-model">Generative Models & Optimal Transport</a> /
        <a href="#control-sampling" onClick="return publicationByTopicSpecific(this)" data-topic="control-sampling">Stochatic Control & Sampling</a> /
        <a href="#equivariant-neural-network" onClick="return publicationByTopicSpecific(this)" data-topic="equivariant-neural-network">Equivariant Neural Networks</a> /
        <a href="#large-language-model" onClick="return publicationByTopicSpecific(this)" data-topic="large-language-model">Large Language Models</a> /
        <a href="#molecular-discovery" onClick="return publicationByTopicSpecific(this)" data-topic="molecular-discovery">Molecular Discovery</a> (* denotes equal contribution, † denotes advising role)
        <br />
    </p>
    <div id="pub-card-container" class="activated hide">
      <div class="pub-card" data-topic="control-sampling" data-year="2025" data-selected="true">
        <strong>Doob's Lagrangian: A Sample-Efficient Variational Approach to Transition Path Sampling</strong><br>
        <em><b>Yuanqi Du*</b>, Michael Plainer*, Rob Brekelmans*, ..., Carla P. Gomes, Alán Aspuru-Guzik, Kirill Neklyudov</em><br>
        NeurIPS 2024 (<b>Spotlight</b>) | <a href="https://openreview.net/forum?id=ShJWT0n7kX">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="large-language-model" data-year="2025" data-selected="true"> 
        <strong>Efficient Evolutionary Search over Chemical Space with Large Language Models</strong><br> 
        <em>Haorui Wang*, Marta Skreta*, …, <b>Yuanqi Du†</b>, Alán Aspuru-Guzik†, Kirill Neklyudov†, Chao Zhang†</em><br>
        ICLR 2025 | <a href="https://molleo.github.io/">paper</a> 
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2025" data-selected="true"> 
        <strong>Diffusion Models as Constrained Samplers for Optimization with Unknown Constraints</strong><br> 
        <em><b>Yuanqi Du*</b>, Lingkai Kong*, Wenhao Mu*, Kirill Neklyudov, Valentin De Bortol, ..., Yi-An Ma, Carla P. Gomes, Chao Zhang</em><br> 
        AISTATS 2025 | <a href="https://arxiv.org/abs/2402.18012">paper</a> 
      </div> 
      <br> 
      <div class="pub-card" data-topic="generative-model" data-year="2025" data-selected="true"> 
        <strong>React-OT: Optimal Transport for Generating Transition State in Chemical Reactions</strong><br> 
        <em>Chenru Duan*, Guan-Horng Liu*, <b>Yuanqi Du*</b>, ..., Carla P. Gomes, Evangelos A. Theodorou, Heather J. Kulik</em><br> 
        Nature Machine Intelligence 2025 | <a href="https://t.co/RwXUSEISmq">paper</a> 
      </div> 
      <br> 
      <div class="pub-card" data-topic="molecular-discovery" data-year="2024" data-selected="true"> 
        <strong>Navigating Chemical Space with Latent Flows</strong><br> 
        <em>Guanghao Wei*, Yining Huang*, Chenru Duan, Yue Song†, <b>Yuanqi Du†</b></em><br> 
        NeurIPS 2024 | <a href="https://arxiv.org/abs/2405.03987">paper</a> 
      </div> 
      <br> 
      <div class="pub-card" data-topic="molecular-discovery" data-year="2024" data-selected="true">
        <strong>Machine Learning-Aided Generative Molecular Design</strong><br>
        <em><b>Yuanqi Du*</b>, Arian R. Jamasb*, Jeff Guo*, ..., Pietro Lio, Philippe Schwaller, Tom L. Blundell</em><br>
        Nature Machine Intelligence 2024 | <a href="https://www.nature.com/articles/s42256-024-00843-5">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2024" data-selected="true">
          <strong>Structure-based Drug Design with Equivariant Diffusion Models</strong><br>
          <em>Arne Schneuing*, Charles Harris*, <b>Yuanqi Du*</b>, ..., Carla P. Gomes, Tom Blundell, Pietro Lió, Max Welling, Michael Bronstein, Bruno Correia</em><br>
          Nature Computational Science 2024 | <a href="https://www.nature.com/articles/s43588-024-00737-x">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2023" data-selected="true">
          <strong>Accurate Transition State Generation with an Object-aware Equivariant Elementary Reaction Diffusion Model</strong><br>
          <em>Chenru Duan, <b>Yuanqi Du</b>, Haojun Jia, Heather J. Kulik</em><br>
          Nature Computational Science 2023 (<b>Cover Story</b>) | <a href="https://www.nature.com/articles/s43588-023-00563-7">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="equivariant-neural-network" data-year="2023" data-selected="true">
          <strong>A New Perspective on Building Efficient and Expressive 3D Equivariant Graph Neural Networks</strong><br>
          <em>Weitao Du*, <b>Yuanqi Du*</b>, Limei Wang*, Dieqiao Feng, Guifeng Wang, Shuiwang Ji, Carla P. Gomes, Zhi-Ming Ma</em><br>
          NeurIPS 2023 | <a href="https://arxiv.org/abs/2304.04757">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="control-sampling" data-year="2023" data-selected="true">
          <strong>Path Integral Stochastic Optimal Control for Sampling Transition Paths</strong><br>
          <em>Lars Holdijk*, <b>Yuanqi Du*</b>, Priyank Jaini, Ferry Hooft, Bernd Ensing, Max Welling</em><br>
          NeurIPS 2023  | <a href="https://arxiv.org/abs/2207.02149">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="molecular-discovery" data-year="2023" data-selected="false">
          <strong>M²Hub: Unlocking the Potential of Machine Learning for Materials Discovery</strong><br>
          <em><b>Yuanqi Du*</b>, Yingheng Wang*, Yining Huang, Jianan Canal Li, ..., Tian Xie, Chenru Duan, John M. Gregoire, Carla P. Gomes</em><br>
          NeurIPS 2023 | <a href="https://arxiv.org/abs/2307.05378">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2023" data-selected="false">
          <strong>A Flexible Diffusion Model</strong><br>
          <em>Weitao Du, Tao Yang, He Zhang, <b>Yuanqi Du</b></em><br>
          ICML 2023 | <a href="https://arxiv.org/abs/2206.10365">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="molecular-discovery" data-year="2023" data-selected="true">
          <strong>Scientific Discovery in the Age of Artificial Intelligence</strong><br>
          <em>Hanchen Wang*, Tianfan Fu*, <b>Yuanqi Du*</b>, ..., Max Welling, Linfeng Zhang, Connor Coley, Yoshua Bengio, Marinka Zitnik</em><br>
          Nature 2023 | <a href="https://www.nature.com/articles/s41586-023-06221-2">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="molecular-discovery" data-year="2023" data-selected="false">
          <strong>ChemSpacE: Interpretable and Interactive Chemical Space Exploration</strong><br>
          <em><b>Yuanqi Du</b>, Xian Liu, Shengchao Liu, Jieyu Zhang, Bolei Zhou</em><br>
          TMLR 2023 | <a href="https://openreview.net/forum?id=C1Xl8dYCBn">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2022" data-selected="false">
          <strong>A Survey on Deep Graph Generation: Methods and Applications</strong><br>
          <em><b>Yuanqi Du*</b>, Yanqiao Zhu*, Yinkai Wang*, Jieyu Zhang, Qiang Liu, Shu Wu</em><br>
          LoG 2022 | <a href="https://arxiv.org/pdf/2203.06714.pdf">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="equivariant-neural-network" data-year="2022" data-selected="true">
          <strong>Equivariant Graph Neural Networks with Complete Local Frames</strong><br>
          <em>Weitao Du*, He Zhang*, <b>Yuanqi Du</b>, Qi Meng, Wei Chen, Tie-Yan Liu, Nanning Zheng, Bin Shao</em><br>
          ICML 2022 | <a href="https://arxiv.org/pdf/2110.14811.pdf">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2022" data-selected="false">
          <strong>Disentangled Spatiotemporal Graph Generative Models</strong><br>
          <em><b>Yuanqi Du*</b>, Xiaojie Guo*, Hengning Cao, Yanfang Ye, Liang Zhao</em><br>
          AAAI 2022 (<b>Oral</b>) | <a href="https://ojs.aaai.org/index.php/AAAI/article/view/20607">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2021" data-selected="false">
          <strong>GraphGT: Machine Learning Datasets for Graph Generation and Transformation</strong><br>
          <em><b>Yuanqi Du*</b>, Shiyu Wang*, Xiaojie Guo, ..., Liang Zhao</em><br>
          NeurIPS 2021 | <a href="https://openreview.net/forum?id=NYgt9vcdyjm">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="generative-model" data-year="2021" data-selected="false">
          <strong>Deep Generative Model for Spatial Networks</strong><br>
          <em>Xiaojie Guo*, <b>Yuanqi Du*</b>, Liang Zhao.</em><br>
          KDD 2021 | <a href="https://arxiv.org/abs/2203.00411">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="control-sampling" data-year="2025" data-selected="true">
          <strong>No Trick, No Treat: Pursuits and Challenges Towards Simulation-free Training of Neural Samplers</strong><br>
          <em>Jiajun He*, <b>Yuanqi Du*</b>, Francisco Vargas, ..., Carla P. Gomes, José Miguel Hernández-Lobato</em><br>
          arXiv preprint arXiv:2502.06685 | <a href="https://arxiv.org/abs/2502.06685">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="large-language-model" data-year="2025" data-selected="true">
          <strong>Large Language Models Are Innate Crystal Structure Generators</strong><br>
          <em>Jingru Gan, Peichen Zhong*, <b>Yuanqi Du*</b>, ..., Carla P. Gomes, Kristin A. Persson, Daniel Schwalbe-Koda, Wei Wang</em><br>
          arXiv preprint (coming out soon) | <a href="#">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="equivariant-neural-network" data-year="2025" data-selected="true">
          <strong>AlphaNet: Scaling Up Local Frame-based Atomistic Foundation Model</strong><br>
          <em>Bangchen Yin, Jiaao Wang†, …, <b>Yuanqi Du†</b>, Carla P. Gomes, Chenru Duan†, Hai Xiao†, Graeme Henkelman†</em><br>
          arXiv preprint arXiv:2501.07155 | <a href="https://arxiv.org/abs/2501.07155">paper</a>
      </div>
      <br>
      <div class="pub-card" data-topic="large-language-model" data-year="2024" data-selected="false">
          <strong>Large Language Models are Catalyzing Chemistry Education</strong><br>
          <em><b>Yuanqi Du*</b>, Chenru Duan*, Andres Bran*, ..., Heather Kulik, Antoine Bosselut, Jinjia Xu, Philippe Schwaller</em><br>
          ChemRxiv 10.26434/chemrxiv-2024-h722v | <a href="https://chemrxiv.org/engage/chemrxiv/article-details/66772be25101a2ffa8412ee0">paper</a>
      </div>
    </div>
  </div>
</div>

<script src="https://code.jquery.com/jquery-3.1.1.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js"
        integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js"
        integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>
<script type="text/javascript">
var allPublications = null;
function publicationBySelected() {
    console.log("publicationBySelected called");
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
$(function() {
    getRealSize = function(bgImg) {
        var img = new Image();
        img.src = bgImg.attr("src");
        var width = img.width,
            height = img.height;
        return {
            width: width,
            height: height
        }
    };
    getRealWindowSize = function() {
        var winWidth = null,
            winHeight = null;
        if (window.innerWidth) winWidth = window.innerWidth;
        else if ((document.body) && (document.body.clientWidth)) winWidth = document.body.clientWidth;
        if (window.innerHeight) winHeight = window.innerHeight;
        else if ((document.body) && (document.body.clientHeight)) winHeight = document.body.clientHeight;
        if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) {
            winHeight = document.documentElement.clientHeight;
            winWidth = document.documentElement.clientWidth
        }
        return {
            width: winWidth,
            height: winHeight
        }
    };
    fullBg = function() {
        var bgImg = $("#background");
        var mainContainer = $("#main");
        var firstFire = null;
        if (bgImg.length == 0) {
            return ;
        }
        function resizeImg() {
            var realSize = getRealSize(bgImg);
            var imgWidth = realSize.width;
            var imgHeight = realSize.height;
            if (imgWidth == 0 || imgHeight == 0) {
                setTimeout(function() {
                    resizeImg();
                }, 200);
            }
            console.log(realSize);
            var realWinSize = getRealWindowSize();
            var winWidth = realWinSize.width;
            var winHeight = realWinSize.height;
            var widthRatio = winWidth / imgWidth;
            var heightRatio = winHeight / imgHeight;
            console.log(realWinSize);
            if (widthRatio > heightRatio) {
                bgImg.width(imgWidth * widthRatio + 'px').height(imgHeight * widthRatio + 'px').css({'top':
                    -(imgHeight * widthRatio - winHeight) / 10 * 5 + 'px', 'left': '0'})
            } else {
                bgImg.width(imgWidth * heightRatio + 'px').height(imgHeight * heightRatio + 'px').css({'left':
                    -(imgWidth * heightRatio - winWidth) / 10 * 3 + 'px', 'top': '0'})
            }
            // mainContainer.css({
            //     width: winWidth,
            //     height: winHeight
            // });
        }
        resizeImg();
        window.onresize = function() {
            if (firstFire === null) {
                firstFire = setTimeout(function() {
                    resizeImg();
                    firstFire = null
                }, 100)
            }
        }
    };
    targetColor = $("#main-content-container .name").css("color");
    animatedLink = function(speed) {
        $("#main-content-container .col-link li").hover(function() {
            $(this).find('.icon').animate({
                color: targetColor,
                borderColor: targetColor
            }, speed);
            $(this).find('.caption').animate({
                color: targetColor
            })
        }, function() {
            $(this).find('.icon').animate({
                borderColor: '#cccccc',
                color: '#cccccc'
            }, speed);
            $(this).find('.caption').animate({
                color: '#cccccc'
            })
        })
    };
    // fullBg();
    // animatedLink(400);
    allPublications = $("#pub-card-container .pub-card");
    allTopicsLink = $("#pub-container .subtitle-aux a");
    allTopics = [];
    for (var topicId = 0; topicId < allTopicsLink.length; topicId++) {
        allTopics.push({name: $(allTopicsLink[topicId]).data("topic"), title: $(allTopicsLink[topicId]).html()});
    }
    $("#publication-by-selected").click();
    // $("#publication-by-date").click();
    $("#pub-card-container").removeClass("hide");
});
</script>
</body>
</html>