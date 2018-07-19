// ==UserScript==
// @name         Bitbucket Show Tortal Lines Removed / Added
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://bitbucket.org/*/pull-requests/*/*
// @grant        none
// ==/UserScript==

(function() {
  "use strict";

  onFilesSummaryLoaded(function() {
    const totalLinesChanged = Array.from(
      document.querySelectorAll("#commit-files-summary .file")
    )
      .map(fileNode => {
        const linesAdded = Number(
          fileNode.querySelector(".lines-added").innerText.substr(1)
        );
        const linesRemoved = Number(
          fileNode.querySelector(".lines-removed").innerText.substr(1)
        );

        return { linesAdded, linesRemoved };
      })
      .reduce(
        function(accu, linesChanged) {
          accu.linesAdded += linesChanged.linesAdded;
          accu.linesRemoved += linesChanged.linesRemoved;

          return accu;
        },
        { linesAdded: 0, linesRemoved: 0 }
      );
      const linesChangeDiff = totalLinesChanged.linesAdded - totalLinesChanged.linesRemoved
    totalLinesChanged.summary =
      linesChangeDiff >= 0 ? "+" + linesChangeDiff : "-" + Math.abs(linesChangeDiff)

    const htmlNode = createElementFromHTML(
      `
        <li class="iterable-item file file-modified" style="padding-bottom: 5px; margin-bottom: 5px; border-bottom: 1px solid #DFE1E6;">
          <div class="commit-file-diff-stats">
            <span class="lines-added">+${totalLinesChanged.linesAdded}</span>
            <span class="lines-removed">-${
              totalLinesChanged.linesRemoved
            }</span>
          </div>

          <span class="commit-files-summary--filename execute" style="font-weight: bold;">
            ${totalLinesChanged.summary} LOC in total
          </span>
        </li>
      `
    );

    document.querySelector("#commit-files-summary").prepend(htmlNode);

    function createElementFromHTML(htmlString) {
      var div = document.createElement("div");
      div.innerHTML = htmlString.trim();

      // Change this to div.childNodes to support multiple top-level nodes
      return div.firstChild;
    }
  });

  function onFilesSummaryLoaded(cb, attempt = 0) {
    const diff = document.querySelector("#pullrequest-diff");

    if (diff) {
      cb();

      return;
    }

    if (attempt >= 50) {
      console.log("No diff found");

      return;
    }

    setTimeout(() => onFilesSummaryLoaded(cb, attempt + 1), 500);
  }
})();
