---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
googlescholar: https://scholar.google.com/citations?user=fAc_zZMAAAAJ&hl=en
---


<h1>Publications</h1>

<!-- Top-level filter choices -->
<div>
  <span class="filter-link" onclick="filterPublications('selected')">Show selected</span>
  <span class="filter-link" onclick="filterPublications('date')">Show all by date</span>
  <span class="filter-link" onclick="filterPublications('topic')">Show all by topic</span>
</div>

<!-- Once the user clicks "show all by topic," reveal these topic links -->
<div id="topicFilters" style="display: none;">
  <!-- Add as many topics as you need -->
  <span class="filter-link" onclick="filterPublications('Generative Models')">Generative Models</span>
  <span class="filter-link" onclick="filterPublications('Stochastic Control')">Stochastic Control</span>
  <span class="filter-link" onclick="filterPublications('Equivariant Neural Networks')">Equivariant Neural Networks</span>
  <span class="filter-link" onclick="filterPublications('Large Language Models')">Large Language Models</span>
</div>

<!-- List of publications. We store custom data in data-* attributes -->
<ul id="publications">
  <li data-selected="true" data-date="2025" data-topics="sampling">
    <strong>No Trick, No Treat: Pursuits and Challenges Towards Simulation-free Training of Neural Samplers</strong><br>
    <em>Jiajun He*, <b>Yuanqi Du*</b>, Francisco Vargas, Dinghuai Zhang, Shreyas Padhy, RuiKang OuYang, Carla P. Gomes, José Miguel Hernández-Lobato.</em><br>
    arXiv 2025 | <a href="https://arxiv.org/abs/2502.06685">paper</a> 
  </li>

  <li data-selected="true" data-date="2025" data-topics="llm">
    <strong>Efficient Evolutionary Search over Chemical Space with Large Language Models</strong><br>
    <em>Haorui Wang*, Marta Skreta*, ..., <b>Yuanqi Du†</b>, Alán Aspuru-Guzik†, Kirill Neklyudov†, Chao Zhang†.</em><br>
    ICLR 2025 | <a href="https://arxiv.org/abs/2406.16976">paper</a> 
  </li>

  <li data-selected="true" data-date="2025" data-topics="llm">
    <strong>Efficient Evolutionary Search over Chemical Space with Large Language Models</strong><br>
    <em>Haorui Wang*, Marta Skreta*, ..., <b>Yuanqi Du†</b>, Alán Aspuru-Guzik†, Kirill Neklyudov†, Chao Zhang†.</em><br>
    ICLR 2025 | <a href="https://arxiv.org/abs/2406.16976">paper</a> 
  </li>

  <li data-selected="true" data-date="2025" data-topics="llm">
    <strong>Efficient Evolutionary Search over Chemical Space with Large Language Models</strong><br>
    <em>Haorui Wang*, Marta Skreta*, ..., <b>Yuanqi Du†</b>, Alán Aspuru-Guzik†, Kirill Neklyudov†, Chao Zhang†.</em><br>
    ICLR 2025 | <a href="https://arxiv.org/abs/2406.16976">paper</a> 
  </li>
</ul>

<script>
  function filterPublications(filter) {
    const publications = document.querySelectorAll('#publications li');
    const topicFilters = document.getElementById('topicFilters');

    // 1) Hide the topic links unless user wants "all by topic" or a specific topic
    if (filter === 'topic') {
      topicFilters.style.display = 'block';
      // Show all items so user can see the entire list grouped by topics
      publications.forEach(pub => pub.style.display = 'list-item');
      return;
    } else if (filter === 'selected') {
      topicFilters.style.display = 'none';
      publications.forEach(pub => {
        // Show only those with data-selected="true"
        pub.style.display = (pub.dataset.selected === 'true') ? 'list-item' : 'none';
      });
      return;
    } else if (filter === 'date') {
      topicFilters.style.display = 'none';
      // Show all items
      publications.forEach(pub => pub.style.display = 'list-item');
      // If you want to sort by date, you can do that here
      return;
    } else {
      // We assume 'filter' is actually a topic string
      topicFilters.style.display = 'block';
      // Show only publications containing that topic
      publications.forEach(pub => {
        if (pub.dataset.topics.includes(filter)) {
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

Preprints
======
* [No Trick, No Treat: Pursuits and Challenges Towards Simulation-free Training of Neural Samplers](https://arxiv.org/abs/2502.06685).  
Jiajun He*, **Yuanqi Du\***, Francisco Vargas, Dinghuai Zhang, Shreyas Padhy, RuiKang OuYang, Carla P. Gomes, José Miguel Hernández-Lobato.  
In arXiv preprint arXiv: 2502.06685.
* [Large Language Models Are Innate Crystal Structure Generators]().  
Jingru Gan, Peichen Zhong*, **Yuanqi Du\***, Yanqiao Zhu, Chenru Duan, Haorui Wang, Carla P. Gomes, Kristin A. Persson, Daniel Schwalbe-Koda, Wei Wang.  
In arXiv preprint (coming out soon).
* [AlphaNet: Scaling Up Local Frame-based Atomistic Foundation Model](https://arxiv.org/abs/2501.07155).  
Bangchen Yin, Jiaao Wang†, ..., **Yuanqi Du†**, Carla P. Gomes, Chenru Duan†, Hai Xiao†, Graeme Henkelman†.  
In arXiv preprint arXiv: 2501.07155.  
* [Large Language Models are Catalyzing Chemistry Education](https://chemrxiv.org/engage/chemrxiv/article-details/66772be25101a2ffa8412ee0).  
**Yuanqi Du\***, Chenru Duan\*, Andres Bran\*, Anna Sotnikova, Yi Qu, Heather Kulik, Antoine Bosselut, Jinjia Xu, Philippe Schwaller.  
In ChemRxiv 10.26434/chemrxiv-2024-h722v.


Selected Publications
======
* [Efficient Evolutionary Search over Chemical Space with Large Language Models](https://molleo.github.io/).  
Haorui Wang\*, Marta Skreta\*, ..., **Yuanqi Du†**, Alán Aspuru-Guzik†, Kirill Neklyudov†, Chao Zhang†.  
In International Conference on Learning Representations (**ICLR**) 2025. In Ai for Science workshop ICML 2024.
* [Diffusion Models as Constrained Samplers for Optimization with Unknown Constraints](https://arxiv.org/abs/2402.18012).  
**Yuanqi Du\***, Lingkai Kong\*, Wenhao Mu\*, Kirill Neklyudov, Valentin De Bortol, Haorui Wang, Dongxia Wu, Aaron Ferber, Yi-An Ma, Carla P. Gomes, Chao Zhang.  
In Artificial Intelligence and Statistics (**AISTATS**) 2025. In Generative Models for Decision Making workshop ICLR 2024.
* [Doob's Lagrangian: A Sample-Efficient Variational Approach to Transition Path Sampling](https://openreview.net/forum?id=ShJWT0n7kX).  
**Yuanqi Du\***, Michael Plainer\*, Rob Brekelmans\*, Chenru Duan, Frank Noe, Carla P. Gomes, Alán Aspuru-Guzik, Kirill Neklyudov.  
In Neural Information Processing Systems (**NeurIPS**) 2024. (**Spotlight**)
* [React-OT: Optimal Transport for Generating Transition State in Chemical Reactions](https://t.co/RwXUSEISmq).  
Chenru Duan\*, Guan-Horng Liu\*, **Yuanqi Du\***, Tianrong Chen, Qiyuan Zhao, Haojun Jia, Carla P. Gomes, Evangelos A. Theodorou, Heather J. Kulik.  
In Nature Machine Intelligence 2025.
* [Navigating Chemical Space with Latent Flows](https://arxiv.org/abs/2405.03987). [Check out our Demo](https://colab.research.google.com/drive/1QAy_QoEnDRaiLF6kJ6RyhuGx1qCJXYKm?usp=sharing)!  
Guanghao Wei\*, Yining Huang\*, Chenru Duan, Yue Song†, **Yuanqi Du†**.  
In Neural Information Processing Systems (**NeurIPS**) 2024.
* [Machine Learning-Aided Generative Molecular Design](https://www.nature.com/articles/s42256-024-00843-5).  
**Yuanqi Du\***, Arian R. Jamasb\*, Jeff Guo\*, Tianfan Fu, Charles Harris, Yingheng Wang, Chenru Duan, Pietro Lio, Philippe Schwaller, Tom L. Blundell.  
In Nature Machine Intelligence 2024.  
* [Structure-based Drug Design with Equivariant Diffusion Models](https://www.nature.com/articles/s43588-024-00737-x).  
Arne Schneuing\*, Charles Harris\*, **Yuanqi Du\***, Arian Jamasb, Ilia Igashov, Weitao Du, Carla P. Gomes, Tom Blundell, Pietro Lió, Max Welling, Michael Bronstein, Bruno Correia.  
In Nature Computational Science 2024. In Machine Learning for Structural Biology workshop NeurIPS 2022. 
* [Accurate Transition State Generation with an Object-aware Equivariant Elementary Reaction Diffusion Model](https://www.nature.com/articles/s43588-023-00563-7).  
Chenru Duan, **Yuanqi Du**, Haojun Jia, Heather J. Kulik.  
In Nature Computational Science 2023. (**Cover Story**)
* [A New Perspective on Building Efficient and Expressive 3D Equivariant Graph Neural Networks](https://arxiv.org/abs/2304.04757).  
Weitao Du\*, **Yuanqi Du\***, Limei Wang\*, Dieqiao Feng, Guifeng Wang, Shuiwang Ji, Carla P. Gomes, Zhi-Ming Ma.  
In Neural Information Processing Systems (**NeurIPS**) 2023. In TAG in ML workshop ICML 2023. (**Oral**)  
* [Path Integral Stochastic Optimal Control for Sampling Transition Paths](https://arxiv.org/abs/2207.02149).  
Lars Holdijk\*, **Yuanqi Du\***, Priyank Jaini, Ferry Hooft, Bernd Ensing, Max Welling.  
In Neural Information Processing Systems (**NeurIPS**) 2023. In Machine Learning for Physical Sciences workshop NeurIPS 2022.   
* [M²Hub: Unlocking the Potential of Machine Learning for Materials Discovery](https://arxiv.org/abs/2307.05378).  
**Yuanqi Du\***, Yingheng Wang\*, Yining Huang, Jianan Canal Li, Yanqiao Zhu, Tian Xie, Chenru Duan, John M. Gregoire, Carla P. Gomes.  
In Neural Information Processing Systems (**NeurIPS**) 2023 Datasets and Benchmarks track. 
* [A Flexible Diffusion Model](https://arxiv.org/abs/2206.10365).  
Weitao Du, Tao Yang, He Zhang, **Yuanqi Du**.  
In International Conference on Machine Learning (**ICML**) 2023.  
* [Scientific Discovery in the Age of Artificial Intelligence](https://www.nature.com/articles/s41586-023-06221-2).  
Hanchen Wang\*, Tianfan Fu\*, **Yuanqi Du\***, Wenhao Gao\+, Kexin Huang\+, Ziming Liu\+, ..., Max Welling, Linfeng Zhang, Connor Coley, Yoshua Bengio, Marinka Zitnik.  
In Nature 2023.
* [ChemSpacE: Interpretable and Interactive Chemical Space Exploration](https://openreview.net/forum?id=C1Xl8dYCBn).  
**Yuanqi Du**, Xian Liu, Shengchao Liu, Jieyu Zhang, Bolei Zhou.  
In Transactions on Machine Learning Research (**TMLR**) 2023. In ELLIS ML4Molecules workshop 2021. (**Oral**)   
* [A Survey on Deep Graph Generation: Methods and Applications](https://arxiv.org/pdf/2203.06714.pdf).  
**Yuanqi Du\***, Yanqiao Zhu\*, Yinkai Wang\*, Jieyu Zhang, Qiang Liu, Shu Wu.  
In First Learning on Graphs conference (**LoG**) 2022.  
* [Equivariant Graph Neural Networks with Complete Local Frames](https://arxiv.org/pdf/2110.14811.pdf).  
Weitao Du\*, He Zhang\*, **Yuanqi Du**, Qi Meng, Wei Chen, Tie-Yan Liu, Nanning Zheng, Bin Shao.  
In Thirty-ninth International Conference on Machine Learning (**ICML**) 2022.  
* [Disentangled Spatiotemporal Graph Generative Models](https://ojs.aaai.org/index.php/AAAI/article/view/20607).  
**Yuanqi Du**\*, Xiaojie Guo\*, Hengning Cao, Yanfang Ye, Liang Zhao.  
In AAAI Conference on Artificial Intelligence (**AAAI**) 2022. (**Oral**)  
* [GraphGT: Machine Learning Datasets for Graph Generation and Transformation](https://openreview.net/forum?id=NYgt9vcdyjm).  
**Yuanqi Du**\*, Shiyu Wang\*, Xiaojie Guo, Hengning Cao, Shujie Hu, Junji Jiang, Aishwarya Varala, Abhinav Angirekula, Liang Zhao.  
In Neural Information Processing Systems (**NeurIPS**) 2021 Datasets and Benchmarks track.
* [Deep Generative Model for Spatial Networks](http://cs.emory.edu/~lzhao41/materials/papers/KDD21__Spatial_Graphs_Disentanglement_preprinted.pdf).  
Xiaojie Guo\*, **Yuanqi Du**\*, Liang Zhao.  
In ACM SIGKDD Conference on Knowledge Discovery and Data Mining (**KDD**) 2021.


