---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
googlescholar: https://scholar.google.com/citations?user=fAc_zZMAAAAJ&hl=en
---

<html>
<head>
  <meta charset="utf-8">
  <title>Publications Demo</title>
  <style>
    /* Simple styling for clickable text/links */
    .filter-link {
      cursor: pointer;
      color: #007ACC;
      text-decoration: underline;
      margin: 0 6px;
    }
    /* Each paper is a .paper-entry */
    .paper-entry {
      margin-bottom: 1.5em;
    }
    /* Styling for paper links */
    .paper-link {
      color: #007ACC;
      text-decoration: none;
      font-size: 0.9em;
    }
    .paper-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

<!-- Filter bar at the top -->
<h2>
  <strong>Publications</strong>
  (
    <span class="filter-link" onclick="filterPublications('selected')">show selected</span> /
    <span class="filter-link" onclick="filterPublications('date')">show all by date</span> /
    <span class="filter-link" onclick="filterPublications('all')">show all by topic</span>
  )
</h2>
<h3>
  <strong>Topics:</strong>
  <span class="filter-link" onclick="filterByTopic('Generative Models')">Generative Models</span> |
  <span class="filter-link" onclick="filterByTopic('Stochastic Control & Sampling')">Stochastic Control &amp; Sampling</span> |
  <span class="filter-link" onclick="filterByTopic('Equivariant Neural Networks')">Equivariant Neural Networks</span> |
  <span class="filter-link" onclick="filterByTopic('Large Language Models')">Large Language Models</span>
</h3>

<!-- The list of publications -->
<div id="publications">

  <!-- Sample preprint, not selected -->
  <div class="paper-entry"
       data-selected="false"
       data-date="2025"
       data-topics="Stochastic Control & Sampling">
    <strong>No Trick, No Treat: Pursuits and Challenges Towards Simulation-free Training of Neural Samplers</strong> (2025)<br>
    Jiajun He*, <strong>Yuanqi Du*</strong>, Francisco Vargas, ...<br>
    <em>arXiv preprint arXiv:2502.06685</em><br>
    <a class="paper-link" href="https://arxiv.org/abs/2502.06685" target="_blank">Paper</a>
  </div>

  <!-- Sample preprint, not selected -->
  <div class="paper-entry"
       data-selected="false"
       data-date="2025"
       data-topics="Large Language Models">
    <strong>Large Language Models Are Innate Crystal Structure Generators</strong> (2025)<br>
    Jingru Gan, Peichen Zhong*, <strong>Yuanqi Du*</strong>, ...<br>
    <em>arXiv preprint (coming soon)</em><br>
    <a class="paper-link" href="#" target="_blank">Paper</a>
  </div>

  <!-- Sample selected publication -->
  <div class="paper-entry"
       data-selected="true"
       data-date="2025"
       data-topics="Large Language Models">
    <strong>Efficient Evolutionary Search over Chemical Space with Large Language Models</strong> (2025)<br>
    Haorui Wang*, Marta Skreta*, ..., <strong>Yuanqi Du†</strong>, ...<br>
    <em>ICLR 2025</em><br>
    <a class="paper-link" href="https://molleo.github.io/" target="_blank">Paper</a>
  </div>

  <!-- Add the rest of your publications here, with appropriate data-selected, data-date, data-topics -->

</div>

<script>
  // Filter by "selected," "date," or "all"
  function filterPublications(mode) {
    const pubs = document.querySelectorAll('.paper-entry');

    if (mode === 'selected') {
      // Show only data-selected="true"
      pubs.forEach(pub => {
        pub.style.display = (pub.dataset.selected === 'true') ? 'block' : 'none';
      });
    } else if (mode === 'date') {
      // Show all
      pubs.forEach(pub => pub.style.display = 'block');
      // If you want, you can add sorting logic by date here
    } else {
      // 'all' => show all (by topic basically means "don't filter, but let user click a topic")
      pubs.forEach(pub => pub.style.display = 'block');
    }
  }

  // Filter by a specific topic
  function filterByTopic(topic) {
    const pubs = document.querySelectorAll('.paper-entry');
    pubs.forEach(pub => {
      const topicsString = pub.dataset.topics || '';
      // Show if the topics string includes the clicked topic
      pub.style.display = topicsString.includes(topic) ? 'block' : 'none';
    });
    // Optionally scroll to the first matched paper
    const firstMatch = document.querySelector(`.paper-entry[data-topics*="${topic}"]`);
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // By default, show "selected" on page load
  window.onload = function() {
    filterPublications('selected');
  };
</script>

</body>
</html>
