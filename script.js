let currentUserId = null;

function fillAdminDetails() {
    document.getElementById("voterId").value = "ADM1234567";
    document.getElementById("name").value = "admin";
}

function getStoredUsers() {
    const localUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
    const defaultUsers = [
        { id: "ADM1234567", name: "admin" },
        { id: "ABC1234567", name: "ravi kumar" },
        { id: "XYZ9876543", name: "rai kumar" }
    ];
    return [...defaultUsers, ...localUsers];
}

function getCandidates() {
    return JSON.parse(localStorage.getItem("candidates") || "[]");
}

function saveCandidates(candidates) {
    localStorage.setItem("candidates", JSON.stringify(candidates));
}

function isValidVoterIdFormat(voterId) {
    return /^[A-Z]{3}[0-9]{7}$/.test(voterId);
}

function validateLogin(event) {
    event.preventDefault();
    const voterId = document.getElementById("voterId").value.trim().toUpperCase();
    const name = document.getElementById("name").value.trim().toLowerCase();

    if (!isValidVoterIdFormat(voterId)) {
        document.getElementById("errorCard").innerText = "❌ Invalid Voter ID format. It should be like ABC1234567.";
        document.getElementById("errorCard").style.display = "block";
        return;
    }

    const allUsers = getStoredUsers();
    const existingUser = allUsers.find(user => user.id === voterId && user.name === name);

    if (existingUser) {
        if (existingUser.id === "ADM1234567") {
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("admin-panel").style.display = "block";
            renderAdmin();
        } else {
            proceedToVoting(existingUser);
        }
    } else {
        const newUser = { id: voterId, name: name };
        const localUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
        localUsers.push(newUser);
        localStorage.setItem("registered_users", JSON.stringify(localUsers));
        proceedToVoting(newUser);
    }
}

function proceedToVoting(user) {
    currentUserId = user.id;
    document.getElementById("voterNameDisplay").textContent = user.name;
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("votingSection").style.display = "block";
    document.getElementById("errorCard").style.display = "none";

    renderCandidates();

    const voted = localStorage.getItem("vote_" + currentUserId);
    if (voted) {
        document.getElementById("voteContent").style.display = "none";
        document.getElementById("alreadyVotedMessage").style.display = "block";
        viewResults();
    } else {
        document.getElementById("voteContent").style.display = "block";
        document.getElementById("alreadyVotedMessage").style.display = "none";
    }
}

function renderCandidates() {
    const candidates = getCandidates();
    const container = document.getElementById("candidateList");
    container.innerHTML = "";
    candidates.forEach(candidate => {
        const col = document.createElement("div");
        col.className = "col-md-6";
        col.innerHTML = `
          <label class="candidate-card w-100">
            <input type="radio" name="candidate" value="${candidate.name}" hidden />
            <div>
              <strong>${candidate.name}</strong><br />
              <small>${candidate.party || ""}</small>
            </div>
          </label>`;
        container.appendChild(col);
    });

    const cards = document.querySelectorAll(".candidate-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            cards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            card.querySelector("input").checked = true;
        });
    });
}

function submitVote() {
    const selected = document.querySelector('input[name="candidate"]:checked');
    if (selected) {
        const vote = selected.value;
        localStorage.setItem("vote_" + currentUserId, vote);
        const counts = JSON.parse(localStorage.getItem("vote_counts") || "{}");
        counts[vote] = (counts[vote] || 0) + 1;
        localStorage.setItem("vote_counts", JSON.stringify(counts));
        alert("Vote submitted for: " + vote);
        document.getElementById("voteContent").style.display = "none";
        document.getElementById("alreadyVotedMessage").style.display = "block";
        viewResults();
    } else {
        alert("Please select a candidate before submitting.");
    }
}

function viewResults() {
    const results = JSON.parse(localStorage.getItem("vote_counts") || "{}");
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";
    const candidates = getCandidates();

    let totalVotes = 0;
    candidates.forEach(c => totalVotes += results[c.name] || 0);

    const labels = [];
    const data = [];
    const percentages = [];

    candidates.forEach(candidate => {
        const votes = results[candidate.name] || 0;
        const percent = totalVotes ? ((votes / totalVotes) * 100).toFixed(2) : 0;
        labels.push(candidate.name);
        data.push(votes);
        percentages.push(percent);

        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.textContent = `${candidate.name}`;
        const badge = document.createElement("span");
        badge.className = "badge bg-primary rounded-pill";
        badge.textContent = `${votes} vote(s) - ${percent}%`;
        li.appendChild(badge);
        resultList.appendChild(li);
    });

    // Show results section
    document.getElementById("resultSection").style.display = "block";

    // Draw chart
    drawResultsChart(labels, data, percentages);
}

let resultChart;

function drawResultsChart(labels, data, percentages) {
    const canvasId = "resultsChartCanvas";

    // Remove old chart canvas if exists
    const oldCanvas = document.getElementById(canvasId);
    if (oldCanvas) oldCanvas.remove();

    // Create new canvas
    const newCanvas = document.createElement("canvas");
    newCanvas.id = canvasId;
    newCanvas.height = 300;
    document.getElementById("resultSection").appendChild(newCanvas);

    const ctx = newCanvas.getContext("2d");
    if (resultChart) resultChart.destroy();

    resultChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Votes",
                data: data,
                backgroundColor: "#0d6efd",
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const idx = context.dataIndex;
                            return `${data[idx]} vote(s) (${percentages[idx]}%)`;
                        }
                    }
                },
                legend: {
                    display: false
                },
                datalabels: {
                    display: true,
                    formatter: (value, context) => percentages[context.dataIndex] + '%',
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Votes"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Candidates"
                    }
                }
            }
        }
    });
}



function logout() {
    document.getElementById("votingSection").style.display = "none";
    document.getElementById("admin-panel").style.display = "none";
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("errorCard").style.display = "none";
    document.getElementById("voterId").value = "";
    document.getElementById("name").value = "";
    document.getElementById("resultSection").style.display = "none";
    currentUserId = null;
}

function addCandidate() {
    const nameInput = document.getElementById("new-candidate");
    const name = nameInput.value.trim();

    if (name) {
        let candidates = getCandidates();

        // Check for duplicate BEFORE adding
        if (candidates.some(candidate => candidate.name.toLowerCase() === name.toLowerCase())) {
            alert("Candidate already exists.");
            return;
        }

        candidates.push({ id: Date.now(), name });
        saveCandidates(candidates);
        nameInput.value = "";
        renderAdmin();
    }
}


function removeCandidate(id) {
    let candidates = getCandidates();
    const nameToRemove = candidates.find(c => c.id === id)?.name;
    candidates = candidates.filter(c => c.id !== id);
    saveCandidates(candidates);

    const voteCounts = JSON.parse(localStorage.getItem("vote_counts") || "{}");
    delete voteCounts[nameToRemove];
    localStorage.setItem("vote_counts", JSON.stringify(voteCounts));

    renderAdmin();
}

function resetVotes() {
    localStorage.setItem("vote_counts", "{}");

    // Remove individual user vote records
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("vote_")) {
            localStorage.removeItem(key);
        }
    });

    alert("All votes have been reset. Voters can vote again.");
    viewResults();
}

function renderAdmin() {
    const candidates = getCandidates();
    const list = document.getElementById("admin-list");
    list.innerHTML = "";
    candidates.forEach(candidate => {
        const div = document.createElement("div");
        div.className = "candidate-admin";
        div.innerHTML = `
          <span>${candidate.name}</span>
          <button class="btn btn-sm btn-danger" onclick="removeCandidate(${candidate.id})">Remove</button>`;
        list.appendChild(div);
    });
}

// Initialize with some default candidates on first load
window.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("candidates")) {
        const defaultCandidates = [
            { id: 1, name: "Jane Smith" },
            { id: 2, name: "John Doe" },
            { id: 3, name: "Alex Johnson" },
            { id: 4, name: "Sarah Williams" }
        ];
        saveCandidates(defaultCandidates);
    }
});