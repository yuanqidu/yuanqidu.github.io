---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
googlescholar: https://scholar.google.com/citations?user=fAc_zZMAAAAJ&hl=en
---

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Publications</title>
  <style>
    /* Simple styling for clickable text */
    .filter-link {
      cursor: pointer;
      font-weight: bold;
      color: #007ACC;
      margin-right: 15px;
      text-decoration: underline;
    }
    #topicFilters {
      margin: 10px 0;
    }
  </style>
</head>
<body>

<h1>Publications</h1>

<!-- Top-level filter choices -->
<div>
  <span class="filter-link" onclick="filterPublications('selected')">Show selected</span>
  <span class="filter-link" onclick="filterPublications('date')">Show all by date</span>
  <span class="filter-link" onclick="filterPublications('topic')">Show all by topic</span>
</div>

<!-- Topic filter choices (hidden until "show all by topic" is clicked) -->
<div id="topicFilters" style="display: none;">
  <span class="filter-link" onclick="filterPublications('Generative Models')">Generative Models</span>
  <span class="filter-link" onclick="filterPublications('Stochastic Control & Sampling')">Stochastic Control &amp; Sampling</span>
  <span class="filter-link" onclick="filterPublications('Equivariant Neural Networks')">Equivariant Neural Networks</span>
  <span class="filter-link" onclick="filterPublications('Large Language Models')">Large Language Models</span>
</div>

<!-- List of publications -->
<ul id="publications">
  <!-- ===================== PREPRINTS (data-selected="false") ===================== -->
  <li data-selected="false" data-date="2025" data-topics="Stochastic Control & Sampling">
    <strong>[No Trick, No Treat: Pursuits and Challenges Towards Simulation-free Training of Neural Samplers]</strong><br>
    <a href="https://arxiv.org/abs/2502.06685">https://arxiv.org/abs/2502.06685</a><br>
    Jiajun He*, <strong>Yuanqi Du*</strong>, Francisco Vargas, Dinghuai Zhang, Shreyas Padhy, RuiKang OuYang, Carla P. Gomes, José Miguel Hernández-Lobato.<br>
    <em>arXiv preprint arXiv: 2502.06685 (2025)</em>
  </li>
  <li data-selected="false" data-date="2025" data-topics="Large Language Models">
    <strong>[Large Language Models Are Innate Crystal Structure Generators]</strong><br>
    <em>(coming soon)</em><br>
    Jingru Gan, Peichen Zhong*, <strong>Yuanqi Du*</strong>, Yanqiao Zhu, Chenru Duan, Haorui Wang, Carla P. Gomes, Kristin A. Persson, Daniel Schwalbe-Koda, Wei Wang.<br>
    <em>arXiv preprint (2025)</em>
  </li>
  <li data-selected="false" data-date="2025" data-topics="Equivariant Neural Networks">
    <strong>[AlphaNet: Scaling Up Local Frame-based Atomistic Foundation Model]</strong><br>
    <a href="https://arxiv.org/abs/2501.07155">https://arxiv.org/abs/2501.07155</a><br>
    Bangchen Yin, Jiaao Wang†, ..., <strong>Yuanqi Du†</strong>, Carla P. Gomes, Chenru Duan†, Hai Xiao†, Graeme Henkelman†.<br>
    <em>arXiv preprint arXiv: 2501.07155 (2025)</em>
  </li>
  <li data-selected="false" data-date="2024" data-topics="Large Language Models">
    <strong>[Large Language Models are Catalyzing Chemistry Education]</strong><br>
    <a href="https://chemrxiv.org/engage/chemrxiv/article-details/66772be25101a2ffa8412ee0">
      https://chemrxiv.org/engage/chemrxiv/article-details/66772be25101a2ffa8412ee0
    </a><br>
    <strong>Yuanqi Du*</strong>, Chenru Duan*, Andres Bran*, Anna Sotnikova, Yi Qu, Heather Kulik, Antoine Bosselut, Jinjia Xu, Philippe Schwaller.<br>
    <em>ChemRxiv 10.26434/chemrxiv-2024-h722v (2024)</em>
  </li>

  <!-- ===================== SELECTED PUBLICATIONS (data-selected="true") ===================== -->
  <li data-selected="true" data-date="2025" data-topics="Large Language Models">
    <strong>[Efficient Evolutionary Search over Chemical Space with Large Language Models]</strong><br>
    <a href="https://molleo.github.io/">https://molleo.github.io/</a><br>
    Haorui Wang*, Marta Skreta*, ..., <strong>Yuanqi Du†</strong>, Alán Aspuru-Guzik†, Kirill Neklyudov†, Chao Zhang†.<br>
    <em>ICLR 2025 (AI for Science workshop ICML 2024)</em>
  </li>
  <li data-selected="true" data-date="2025" data-topics="Stochastic Control & Sampling, Generative Models">
    <strong>[Diffusion Models as Constrained Samplers for Optimization with Unknown Constraints]</strong><br>
    <a href="https://arxiv.org/abs/2402.18012">https://arxiv.org/abs/2402.18012</a><br>
    <strong>Yuanqi Du*</strong>, Lingkai Kong*, Wenhao Mu*, Kirill Neklyudov, Valentin De Bortol, Haorui Wang, Dongxia Wu, Aaron Ferber, Yi-An Ma, Carla P. Gomes, Chao Zhang.<br>
    <em>AISTATS 2025 (Generative Models for Decision Making workshop ICLR 2024)</em>
  </li>
  <li data-selected="true" data-date="2024" data-topics="Stochastic Control & Sampling">
    <strong>[Doob's Lagrangian: A Sample-Efficient Variational Approach to Transition Path Sampling]</strong><br>
    <a href="https://openreview.net/forum?id=ShJWT0n7kX">https://openreview.net/forum?id=ShJWT0n7kX</a><br>
    <strong>Yuanqi Du*</strong>, Michael Plainer*, Rob Brekelmans*, Chenru Duan, Frank Noe, Carla P. Gomes, Alán Aspuru-Guzik, Kirill Neklyudov.<br>
    <em>NeurIPS 2024 (Spotlight)</em>
  </li>
  <li data-selected="true" data-date="2025" data-topics="Stochastic Control & Sampling">
    <strong>[React-OT: Optimal Transport for Generating Transition State in Chemical Reactions]</strong><br>
    <a href="https://t.co/RwXUSEISmq">https://t.co/RwXUSEISmq</a><br>
    Chenru Duan*, Guan-Horng Liu*, <strong>Yuanqi Du*</strong>, Tianrong Chen, Qiyuan Zhao, Haojun Jia, Carla P. Gomes, Evangelos A. Theodorou, Heather J. Kulik.<br>
    <em>Nature Machine Intelligence 2025</em>
  </li>
  <li data-selected="true" data-date="2024" data-topics="Generative Models">
    <strong>[Navigating Chemical Space with Latent Flows]</strong><br>
    <a href="https://arxiv.org/abs/2405.03987">https://arxiv.org/abs/2405.03987</a> | 
    <a href="https://colab.research.google.com/drive/1QAy_QoEnDRaiLF6kJ6RyhuGx1qCJXYKm?usp=sharing">Demo</a><br>
    Guanghao Wei*, Yining Huang*, Chenru Duan, Yue Song†, <strong>Yuanqi Du†</strong>.<br>
    <em>NeurIPS 2024</em>
  </li>
  <li data-selected="true" data-date="2024" data-topics="Generative Models">
    <strong>[Machine Learning-Aided Generative Molecular Design]</strong><br>
    <a href="https://www.nature.com/articles/s42256-024-00843-5">
      https://www.nature.com/articles/s42256-024-00843-5
    </a><br>
    <strong>Yuanqi Du*</strong>, Arian R. Jamasb*, Jeff Guo*, Tianfan Fu, Charles Harris, Yingheng Wang, Chenru Duan, Pietro Lio, Philippe Schwaller, Tom L. Blundell.<br>
    <em>Nature Machine Intelligence 2024</em>
  </li>
  <li data-selected="true" data-date="2024" data-topics="Equivariant Neural Networks">
    <strong>[Structure-based Drug Design with Equivariant Diffusion Models]</strong><br>
    <a href="https://www.nature.com/articles/s43588-024-00737-x">
      https://www.nature.com/articles/s43588-024-00737-x
    </a><br>
    Arne Schneuing*, Charles Harris*, <strong>Yuanqi Du*</strong>, Arian Jamasb, Ilia Igashov, Weitao Du, Carla P. Gomes, Tom Blundell, Pietro Lió, Max Welling, Michael Bronstein, Bruno Correia.<br>
    <em>Nature Computational Science 2024</em>
  </li>
  <li data-selected="true" data-date="2023" data-topics="Equivariant Neural Networks">
    <strong>[Accurate Transition State Generation with an Object-aware Equivariant Elementary Reaction Diffusion Model]</strong><br>
    <a href="https://www.nature.com/articles/s43588-023-00563-7">
      https://www.nature.com/articles/s43588-023-00563-7
    </a><br>
    Chenru Duan, <strong>Yuanqi Du</strong>, Haojun Jia, Heather J. Kulik.<br>
    <em>Nature Computational Science 2023 (Cover Story)</em>
  </li>
  <li data-selected="true" data-date="2023" data-topics="Equivariant Neural Networks">
    <strong>[A New Perspective on Building Efficient and Expressive 3D Equivariant Graph Neural Networks]</strong><br>
    <a href="https://arxiv.org/abs/2304.04757">https://arxiv.org/abs/2304.04757</a><br>
    Weitao Du*, <strong>Yuanqi Du*</strong>, Limei Wang*, Dieqiao Feng, Guifeng Wang, Shuiwang Ji, Carla P. Gomes, Zhi-Ming Ma.<br>
    <em>NeurIPS 2023 (Oral, TAG in ML workshop ICML 2023)</em>
  </li>
  <li data-selected="true" data-date="2023" data-topics="Stochastic Control & Sampling">
    <strong>[Path Integral Stochastic Optimal Control for Sampling Transition Paths]</strong><br>
    <a href="https://arxiv.org/abs/2207.02149">https://arxiv.org/abs/2207.02149</a><br>
    Lars Holdijk*, <strong>Yuanqi Du*</strong>, Priyank Jaini, Ferry Hooft, Bernd Ensing, Max Welling.<br>
    <em>NeurIPS 2023 (ML for Physical Sciences workshop NeurIPS 2022)</em>
  </li>
  <li data-selected="true" data-date="2023" data-topics="">
    <strong>[M²Hub: Unlocking the Potential of Machine Learning for Materials Discovery]</strong><br>
    <a href="https://arxiv.org/abs/2307.05378">https://arxiv.org/abs/2307.05378</a><br>
    <strong>Yuanqi Du*</strong>, Yingheng Wang*, Yining Huang, Jianan Canal Li, Yanqiao Zhu, Tian Xie, Chenru Duan, John M. Gregoire, Carla P. Gomes.<br>
    <em>NeurIPS 2023 Datasets and Benchmarks track</em>
  </li>
  <li data-selected="true" data-date="2023" data-topics="Generative Models">
    <strong>[A Flexible Diffusion Model]</strong><br>
    <a href="https://arxiv.org/abs/2206.10365">https://arxiv.org/abs/2206.10365</a><br>
    Weitao Du, Tao Yang, He Zhang, <strong>Yuanqi Du</strong>.<br>
    <em>ICML 2023</em>
  </li>
  <li data-selected="true" data-date="2023" data-topics="">
    <strong>[Scientific Discovery in the Age of Artificial Intelligence]</strong><br>
    <a href="https://www.nature.com/articles/s41586-023-06221-2">
      https://www.nature.com/articles/s41586-023-06221-2
    </a><br>
    Hanchen Wang*, Tianfan Fu*, <strong>Yuanqi Du*</strong>, Wenhao Gao+, Kexin Huang+, Ziming Liu+, ..., Max Welling, Linfeng Zhang, Connor Coley, Yoshua Bengio, Marinka Zitnik.<br>
    <em>Nature 2023</em>
  </li>
  <li data-selected="true" data-date="2023" data-topics="">
    <strong>[ChemSpacE: Interpretable and Interactive Chemical Space Exploration]</strong><br>
    <a href="https://openreview.net/forum?id=C1Xl8dYCBn">https://openreview.net/forum?id=C1Xl8dYCBn</a><br>
    <strong>Yuanqi Du</strong>, Xian Liu, Shengchao Liu, Jieyu Zhang, Bolei Zhou.<br>
    <em>TMLR 2023 (ELLIS ML4Molecules workshop 2021, Oral)</em>
  </li>
  <li data-selected="true" data-date="2022" data-topics="Generative Models">
    <strong>[A Survey on Deep Graph Generation: Methods and Applications]</strong><br>
    <a href="https://arxiv.org/pdf/2203.06714.pdf">https://arxiv.org/pdf/2203.06714.pdf</a><br>
    <strong>Yuanqi Du*</strong>, Yanqiao Zhu*, Yinkai Wang*, Jieyu Zhang, Qiang Liu, Shu Wu.<br>
    <em>LoG 2022</em>
  </li>
  <li data-selected="true" data-date="2022" data-topics="Equivariant Neural Networks">
    <strong>[Equivariant Graph Neural Networks with Complete Local Frames]</strong><br>
    <a href="https://arxiv.org/pdf/2110.14811.pdf">https://arxiv.org/pdf/2110.14811.pdf</a><br>
    Weitao Du*, He Zhang*, <strong>Yuanqi Du</strong>, Qi Meng, Wei Chen, Tie-Yan Liu, Nanning Zheng, Bin Shao.<br>
    <em>ICML 2022</em>
  </li>
  <li data-selected="true" data-date="2022" data-topics="Generative Models">
    <strong>[Disentangled Spatiotemporal Graph Generative Models]</strong><br>
    <a href="https://ojs.aaai.org/index.php/AAAI/article/view/20607">
      https://ojs.aaai.org/index.php/AAAI/article/view/20607
    </a><br>
    <strong>Yuanqi Du*</strong>, Xiaojie Guo*, Hengning Cao, Yanfang Ye, Liang Zhao.<br>
    <em>AAAI 2022 (Oral)</em>
  </li>
  <li data-selected="true" data-date="2021" data-topics="Generative Models">
    <strong>[GraphGT: Machine Learning Datasets for Graph Generation and Transformation]</strong><br>
    <a href="https://openreview.net/forum?id=NYgt9vcdyjm">https://openreview.net/forum?id=NYgt9vcdyjm</a><br>
    <strong>Yuanqi Du*</strong>, Shiyu Wang*, Xiaojie Guo, Hengning Cao, Shujie Hu, Junji Jiang, Aishwarya Varala, Abhinav Angirekula, Liang Zhao.<br>
    <em>NeurIPS 2021 Datasets and Benchmarks track</em>
  </li>
  <li data-selected="true" data-date="2021" data-topics="Generative Models">
    <strong>[Deep Generative Model for Spatial Networks]</strong><br>
    <a href="http://cs.emory.edu/~lzhao41/materials/papers/KDD21__Spatial_Graphs_Disentanglement_preprinted.pdf">
      http://cs.emory.edu/~lzhao41/materials/papers/KDD21__Spatial_Graphs_Disentanglement_preprinted.pdf
    </a><br>
    Xiaojie Guo*, <strong>Yuanqi Du*</strong>, Liang Zhao.<br>
    <em>KDD 2021</em>
  </li>
</ul>

<script>
  function filterPublications(filter) {
    const publications = document.querySelectorAll('#publications li');
    const topicFilters = document.getElementById('topicFilters');

    if (filter === 'topic') {
      // Show the topic links
      topicFilters.style.display = 'block';
      // Show all items
      publications.forEach(pub => {
        pub.style.display = 'list-item';
      });
      return;
    } else if (filter === 'selected') {
      topicFilters.style.display = 'none';
      publications.forEach(pub => {
        pub.style.display = (pub.dataset.selected === 'true') ? 'list-item' : 'none';
      });
      return;
    } else if (filter === 'date') {
      topicFilters.style.display = 'none';
      // Show all items (optionally sort them by date if you wish)
      publications.forEach(pub => {
        pub.style.display = 'list-item';
      });
      return;
    } else {
      // Otherwise, assume filter is a topic string
      topicFilters.style.display = 'block';
      publications.forEach(pub => {
        // Show the publication if its data-topics contains the filter text
        if (pub.dataset.topics && pub.dataset.topics.includes(filter)) {
          pub.style.display = 'list-item';
        } else {
          pub.style.display = 'none';
        }
      });
      // Optionally scroll to the first match
      const firstMatch = document.querySelector(`#publications li[data-topics*="${filter}"]`);
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Default to 'selected' on page load
  window.onload = function() {
    filterPublications('selected');
  };
</script>

</body>
</html>



