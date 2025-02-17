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
    /* Styling for the paper link */
    .paper-button {
      cursor: pointer;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.9em;
      text-decoration: none;
      color: black;
    }
    .paper-button:hover {
      background-color: #e6e6e6;
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

  <!-- Publication 1: Stochastic Control & Sampling (not selected) -->
  <div class="paper-entry"
       data-selected="false"
       data-date="2025"
       data-topics="Stochastic Control & Sampling">
    <strong>No Trick, No Treat: Pursuits and Challenges Towards Simulation-free Training of Neural Samplers</strong> (2025)<br>
    Jiajun He*, <strong>Yuanqi Du*</strong>, Francisco Vargas, ...<br>
    <em>arXiv preprint arXiv:2502.06685</em><br>
    <a class="paper-button" href="https://arxiv.org/abs/2502.06685" target="_blank">Paper</a>
  </div>

  <!-- Publication 2: Large Language Models (not selected) -->
  <div class="paper-entry"
       data-selected="false"
       data-date="2025"
       data-topics="Large Language Models">
    <strong>Large Language Models Are Innate Crystal Structure Generators</strong> (2025)<br>
    Jingru Gan, Peichen Zhong*, <strong>Yuanqi Du*</strong>, ...<br>
    <em>arXiv preprint (coming soon)</em><br>
    <a class="paper-button" href="#" onclick="return false;">Paper</a>
  </div>

  <!-- Publication 3: Large Language Models (selected) -->
  <div class="paper-entry"
       data-selected="true"
       data-date="2025"
       data-topics="Large Language Models">
    <strong>Efficient Evolutionary Search over Chemical Space with Large Language Models</strong> (2025)<br>
    Haorui Wang*, Marta Skreta*, ..., <strong>Yuanqi Du†</strong>, ...<br>
    <em>ICLR 2025</em><br>
    <a class="paper-button" href="https://molleo.github.io/" target="_blank">Paper</a>
  </div>

  <!-- Publication 4: Generative Models (selected) -->
  <div class="paper-entry"
       data-selected="true"
       data-date="2024"
       data-topics="Generative Models">
    <strong>Generative Models for Testing Purposes</strong> (2024)<br>
    Alice Example, Bob Example<br>
    <em>Conference XYZ 2024</em><br>
    <a class="paper-button" href="https://example.com/generative" target="_blank">Paper</a>
  </div>

  <!-- Publication 5: Equivariant Neural Networks (not selected) -->
  <div class="paper-entry"
       data-selected="false"
       data-date="2023"
       data-topics="Equivariant Neural Networks">
    <strong>Equivariant Neural Networks: An Overview</strong> (2023)<br>
    Carol Researcher, Dave Scientist<br>
    <em>Journal of Neural Networks, 2023</em><br>
    <a class="paper-button" href="https://example.com/equiv" target="_blank">Paper</a>
  </div>

</div>

<script>
  // Filter by "selected," "date," or "all"
  function filterPublications(mode) {
    const pubs = document.querySelectorAll('.paper-entry');

    if (mode === 'selected') {
      // Show only publications with data-selected="true"
      pubs.forEach(pub => {
        pub.style.display = (pub.dataset.selected === 'true') ? 'block' : 'none';
      });
    } else if (mode === 'date') {
      // Show all publications...
      pubs.forEach(pub => pub.style.display = 'block');
      // ...and sort them by date (descending)
      const container = document.getElementById('publications');
      const pubsArray = Array.from(pubs);
      pubsArray.sort((a, b) => parseInt(b.dataset.date) - parseInt(a.dataset.date));
      pubsArray.forEach(pub => container.appendChild(pub));
    } else {
      // "all" mode: show all publications (no sorting)
      pubs.forEach(pub => pub.style.display = 'block');
    }
  }

  // Filter by a specific topic
  function filterByTopic(topic) {
    const pubs = document.querySelectorAll('.paper-entry');
    pubs.forEach(pub => {
      const topicsString = pub.dataset.topics || '';
      // Display the publication only if it includes the selected topic
      pub.style.display = topicsString.includes(topic) ? 'block' : 'none';
    });
    // Scroll to the first matched paper, if any
    const firstMatch = document.querySelector(`.paper-entry[data-topics*="${topic}"]`);
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // By default, show "selected" publications on page load.
  window.onload = function() {
    filterPublications('selected');
  };
</script>

</body>
</html>
