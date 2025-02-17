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
  <style>
    .filter-link {
      cursor: pointer;
      color: #007ACC;
      text-decoration: underline;
      margin: 0 10px;
    }
    #topicFilters {
      margin-bottom: 20px;
    }
    .paper-entry {
      margin-bottom: 1.5em;
    }
    .paper-button {
      cursor: pointer;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    .paper-button:hover {
      background-color: #e6e6e6;
    }
  </style>
</head>
<body>

<!-- Top line: Publications ( show selected / show all by date / show all by topic ) -->
<h1>
  <strong>Publications</strong>
  (<span class="filter-link" onclick="filterPublications('selected')">show selected</span>/<span class="filter-link" onclick="filterPublications('date')">show all by date</span>/<span class="filter-link" onclick="filterPublications('topic')">show all by topic</span>)
</h1>

<!-- Topics line (hidden by default until "show all by topic") -->
<div id="topicFilters" style="display: none;">
  Topics: 
  <span class="filter-link" onclick="filterPublications('Generative Models')">Generative Models</span> / 
  <span class="filter-link" onclick="filterPublications('Stochastic Control & Sampling')">Stochastic Control &amp; Sampling</span> / 
  <span class="filter-link" onclick="filterPublications('Equivariant Neural Networks')">Equivariant Neural Networks</span> / 
  <span class="filter-link" onclick="filterPublications('Large Language Models')">Large Language Models</span>
</div>

<!-- The publication list -->
<div id="publications">

  <!-- Example: Preprint / Not Selected -->
  <div class="paper-entry" data-selected="false" data-date="2025" data-topics="Stochastic Control & Sampling">
    <strong>No Trick, No Treat: Pursuits and Challenges Towards Simulation-free Training of Neural Samplers</strong> (2025)<br>
    Jiajun He*, <strong>Yuanqi Du*</strong>, Francisco Vargas, Dinghuai Zhang, Shreyas Padhy, RuiKang OuYang, Carla P. Gomes, José Miguel Hernández-Lobato<br>
    <em>arXiv preprint arXiv: 2502.06685</em><br>
    <button class="paper-button" onclick="window.open('https://arxiv.org/abs/2502.06685','_blank')">Paper</button>
  </div>

  <div class="paper-entry" data-selected="false" data-date="2025" data-topics="Large Language Models">
    <strong>Large Language Models Are Innate Crystal Structure Generators</strong> (2025)<br>
    Jingru Gan, Peichen Zhong*, <strong>Yuanqi Du*</strong>, Yanqiao Zhu, Chenru Duan, Haorui Wang, Carla P. Gomes, Kristin A. Persson, Daniel Schwalbe-Koda, Wei Wang<br>
    <em>arXiv preprint (coming soon)</em><br>
    <button class="paper-button">Paper</button> <!-- link not provided yet -->
  </div>

  <div class="paper-entry" data-selected="false" data-date="2025" data-topics="Equivariant Neural Networks">
    <strong>AlphaNet: Scaling Up Local Frame-based Atomistic Foundation Model</strong> (2025)<br>
    Bangchen Yin, Jiaao Wang†, ..., <strong>Yuanqi Du†</strong>, Carla P. Gomes, Chenru Duan†, Hai Xiao†, Graeme Henkelman†<br>
    <em>arXiv preprint arXiv: 2501.07155</em><br>
    <button class="paper-button" onclick="window.open('https://arxiv.org/abs/2501.07155','_blank')">Paper</button>
  </div>

  <!-- Selected publication -->
  <div class="paper-entry" data-selected="true" data-date="2025" data-topics="Large Language Models">
    <strong>Efficient Evolutionary Search over Chemical Space with Large Language Models</strong> (2025)<br>
    Haorui Wang*, Marta Skreta*, ..., <strong>Yuanqi Du†</strong>, Alán Aspuru-Guzik†, Kirill Neklyudov†, Chao Zhang†<br>
    <em>ICLR 2025 (AI for Science workshop ICML 2024)</em><br>
    <button class="paper-button" onclick="window.open('https://molleo.github.io/','_blank')">Paper</button>
  </div>

  <!-- Add the rest of your publications similarly... -->
  <!-- Just remove the square brackets around the title, remove the link text, and use a button. -->
  <!-- Also keep data-selected, data-date, data-topics for filtering. -->

</div>

<script>
  function filterPublications(filter) {
    const pubs = document.querySelectorAll('#publications .paper-entry');
    const topicFilters = document.getElementById('topicFilters');

    if (filter === 'topic') {
      // Reveal topic line, show all
      topicFilters.style.display = 'block';
      pubs.forEach(pub => pub.style.display = 'block');
      return;
    } else if (filter === 'selected') {
      topicFilters.style.display = 'none';
      pubs.forEach(pub => {
        pub.style.display = (pub.dataset.selected === 'true') ? 'block' : 'none';
      });
      return;
    } else if (filter === 'date') {
      topicFilters.style.display = 'none';
      // Show all; optionally sort by date if you want
      pubs.forEach(pub => pub.style.display = 'block');
      return;
    } else {
      // Filter by topic
      topicFilters.style.display = 'block';
      pubs.forEach(pub => {
        if (pub.dataset.topics && pub.dataset.topics.includes(filter)) {
          pub.style.display = 'block';
        } else {
          pub.style.display = 'none';
        }
      });
      // Optionally scroll to the first match
      const firstMatch = document.querySelector(`#publications .paper-entry[data-topics*="${filter}"]`);
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Default to selected on load
  window.onload = function() {
    filterPublications('selected');
  };
</script>

</body>
</html>
