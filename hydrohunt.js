/* ======================================
   HYDROHERO HUNT - MAIN JAVASCRIPT
====================================== */

const $ = id => document.getElementById(id);

const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,"0"),
    String(d.getDate()).padStart(2,"0")
  ].join("-");
};

const defaultData = {
  date: today(),
  water: 1750,
  goal: 2275,
  weight: 65,
  coffee: 0,
  streak: 3,
  lastCompletedDate: "",
  teamName: "Hydro Warriors",
  teamCode: "HERO123",
  history: [1800,2100,1900,2400,1700,2200,1750],
  members: [
    {name:"Mohana",water:2002,goal:2275},
    {name:"Ananya",water:1729,goal:2275},
    {name:"Rahul",water:1865,goal:2275},
    {name:"Sneha",water:1501,goal:2275}
  ]
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem("hydroHeroData"));
    return saved ? {...defaultData,...saved} : {...defaultData};
  } catch {
    return {...defaultData};
  }
}

let data = loadData();

if (data.date !== today()) {
  data.history = [...data.history.slice(-6),data.water].slice(-7);
  data.water = 0;
  data.coffee = 0;
  data.date = today();
}

function saveData() {
  localStorage.setItem("hydroHeroData",JSON.stringify(data));
}

/* TOAST MESSAGE */

function toast(message) {
  const box = $("toast");
  box.textContent = message;
  box.classList.add("show");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    box.classList.remove("show");
  },2600);
}

/* DAILY TARGET */

function currentGoal() {
  return data.goal + data.coffee * 200;
}

/* WATER LOGGING */

function addWater(amount) {

  if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) {
    toast("Please enter a valid water amount.");
    return;
  }

  data.water += amount;

  // Update the current user's team contribution.
  const me = data.members.find(m => m.name === "Mohana");

  if (me) {
    me.water = data.water;
    me.goal = currentGoal();
  }

  $("lastSip").textContent =
    `💧 Great! ${amount} ml of water added successfully.`;

  checkStreak();
  render();
  toast(`💧 ${amount} ml added! Keep going!`);
}

function customAdd() {
  const amount = Number($("customWater").value);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) {
    toast("Enter an amount between 1 and 5000 ml.");
    return;
  }

  addWater(amount);
  $("customWater").value = "";
}

/* WATER PROGRESS */

function updateTracker() {

  const goal = currentGoal();
  const percentage = Math.round(data.water / goal * 100);
  const progress = Math.min(percentage,100);
  const remaining = Math.max(goal-data.water,0);

  $("statWater").textContent = data.water + " ml";
  $("statGoal").textContent = goal + " ml";
  $("statStreak").textContent = data.streak + " Days";

  $("drank").textContent = data.water + " ml";
  $("remaining").textContent = remaining + " ml";

  $("percent").textContent = progress + "%";

  $("bottleGoal").textContent = goal;
  $("waterFill").style.height = progress + "%";
  $("progress").style.width = progress + "%";

  $("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday:"long",
      day:"numeric",
      month:"short",
      year:"numeric"
    });

  if (data.water >= goal) {
    $("remaining").textContent = "Goal Completed! 🎉";
  }
}

/* STREAK SYSTEM */

function checkStreak() {

  if (
    data.water >= currentGoal() &&
    data.lastCompletedDate !== today()
  ) {
    data.streak++;
    data.lastCompletedDate = today();
    toast("🏆 Congratulations! Daily hydration goal completed!");
  }
}

/* CALCULATOR */

function calculateGoal() {

  const weight = Number($("weight").value);

  if (!Number.isFinite(weight) || weight < 1 || weight > 300) {
    toast("Please enter a valid weight.");
    return;
  }

  data.weight = weight;
  data.goal = Math.round(weight * 35);

  $("goalResult").textContent =
    "Your estimated daily target: " + data.goal + " ml";

  render();
  toast("🎯 Your daily water target is updated!");
}

/* CAFFEINE TRACKER */

function addCoffee() {

  data.coffee++;

  $("coffeeResult").textContent =
    data.coffee + " drink(s) logged. Additional target: " +
    (data.coffee * 200) + " ml.";

  const me = data.members.find(m => m.name === "Mohana");
  if (me) me.goal = currentGoal();

  render();

  toast("☕ Additional 200 ml target added!");
}

/* TEAM SCORING */

function teamScore() {

  if (!data.members.length) return 0;

  const total = data.members.reduce((sum,member) => {
    return sum + Math.min(member.water/member.goal,1)*100;
  },0);

  return Math.round(total/data.members.length);
}

function updateTeam() {

  $("teamName").textContent = data.teamName;
  $("members").textContent = data.members.length;
  $("teamScore").textContent = teamScore() + "%";

  $("memberList").innerHTML = data.members.map(member => {

    const score = Math.round(
      member.water/member.goal*100
    );

    return `
      <div class="member-row">
        <div class="member-avatar">
          ${escapeHTML(member.name.charAt(0).toUpperCase())}
        </div>
        <div class="member-name">${escapeHTML(member.name)}</div>
        <div class="member-bar">
          <div style="width:${Math.min(score,100)}%"></div>
        </div>
        <div class="member-score">${score}%</div>
      </div>
    `;

  }).join("");

}

/* ESCAPE USER INPUT */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g,char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[char]);
}

/* LEADERBOARD */

function updateLeaderboard() {

  const teams = [
    {name:"Hostel Block A",score:86},
    {name:"Hydro Achievers",score:74},
    {name:"Sip Kings",score:69},
    {name:data.teamName,score:teamScore()}
  ];

  const unique = [
    ...new Map(teams.map(t => [t.name,t])).values()
  ];

  unique.sort((a,b) => b.score-a.score);

  const rank = unique.findIndex(
    t => t.name === data.teamName
  ) + 1;

  $("statRank").textContent = "#" + rank;

  $("rankList").innerHTML = unique.map((team,index) => `
    <div class="rank-row">
      <span>#${index+1}</span>
      <div>${escapeHTML(team.name)}
        ${team.name === data.teamName ? " ⭐ YOU" : ""}
      </div>
      <strong>${team.score}%</strong>
    </div>
  `).join("");
}

/* TEAM CREATION */

function openModal(id) {
  $(id).classList.add("show");
}

function closeModal(id) {
  $(id).classList.remove("show");
}

function createTeam() {

  const name = $("newTeam").value.trim();
  const code = $("newCode").value.trim().toUpperCase();

  if (name.length < 3 || code.length < 4) {
    toast("Enter a team name and code of at least 4 characters.");
    return;
  }

  data.teamName = name;
  data.teamCode = code;

  data.members = [
    {name:"Mohana",water:data.water,goal:currentGoal()},
    {name:"Member 2",water:0,goal:2275},
    {name:"Member 3",water:0,goal:2275},
    {name:"Member 4",water:0,goal:2275}
  ];

  closeModal("createModal");
  render();

  toast("🚀 Your new HydroHero squad is ready!");
}

/* JOIN TEAM */

function joinTeam() {

  const code = $("inviteCode").value.trim().toUpperCase();

  if (!code) {
    toast("Please enter an invitation code.");
    return;
  }

  if (code === "HERO123" || code === data.teamCode) {

    data.teamName = "Hydro Warriors";

    data.members = [
      {name:"Mohana",water:data.water,goal:currentGoal()},
      {name:"Ananya",water:1729,goal:2275},
      {name:"Rahul",water:1865,goal:2275},
      {name:"Sneha",water:1501,goal:2275}
    ];

    closeModal("joinModal");
    render();

    toast("🎉 Successfully joined Hydro Warriors!");

  } else {
    toast("Invalid code. Try HERO123 for the demo.");
  }
}

/* PLANT COMPANION */

function updatePlant() {

  const percentage = data.water/currentGoal()*100;

  let emoji = "🌱";
  let message = "Your seed is waiting! Keep drinking water.";

  if (percentage >= 100) {
    emoji = "🌳";
    message = "Amazing! Your hydration garden is flourishing!";
  } else if (percentage >= 75) {
    emoji = "🌻";
    message = "Your plant is blooming beautifully!";
  } else if (percentage >= 40) {
    emoji = "🌿";
    message = "Your plant is growing. Keep sipping!";
  } else if (percentage >= 15) {
    emoji = "🪴";
    message = "Your little plant is getting stronger!";
  }

  $("plantEmoji").textContent = emoji;
  $("plantStatus").textContent = message;
}

/* WEEKLY ANALYTICS */

let chart;

function updateChart() {

  if (typeof Chart === "undefined") return;

  const values = [
    ...data.history.slice(-6),
    data.water
  ];

  const labels = [];

  for (let i=6;i>=0;i--) {
    const d = new Date();
    d.setDate(d.getDate()-i);

    labels.push(d.toLocaleDateString("en",{
      weekday:"short"
    }));
  }

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
    return;
  }

  chart = new Chart($("waterChart"),{
    type:"line",

    data:{
      labels:labels,
      datasets:[{
        label:"Water Intake",
        data:values,
        borderColor:"#0b9fd0",
        backgroundColor:"rgba(27,195,199,.13)",
        fill:true,
        tension:.4,
        pointRadius:5,
        pointBackgroundColor:"#0b9fd0",
        borderWidth:3
      }]
    },

    options:{
      responsive:true,
      maintainAspectRatio:false,

      plugins:{
        legend:{display:false}
      },

      scales:{
        y:{
          beginAtZero:true,
          grid:{color:"#edf2f6"},
          ticks:{font:{size:10}}
        },

        x:{
          grid:{display:false},
          ticks:{font:{size:10}}
        }
      }
    }
  });
}

/* NOTIFICATIONS */

let reminderInterval = null;

async function enableReminder() {

  if (!("Notification" in window)) {
    toast("Browser notifications are not supported.");
    return;
  }

  try {

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      toast("Please allow notifications in browser settings.");
      return;
    }

    $("reminderStatus").textContent = "🔔 Reminders enabled!";
    toast("Hydration reminders enabled!");

    if (reminderInterval) {
      clearInterval(reminderInterval);
    }

    reminderInterval = setInterval(() => {

      const hour = new Date().getHours();

      if (hour >= 8 && hour < 21) {
        new Notification("💧 HydroHero Reminder",{
          body:"Take a small sip of water. Your squad is counting on you!"
        });
      }

    },60*60*1000);

  } catch {
    toast("Could not enable notifications.");
  }
}

/* CUSTOM INPUT ENTER */

$("customWater").addEventListener("keydown",event => {
  if (event.key === "Enter") customAdd();
});

/* MAIN RENDER */

function render() {

  updateTracker();
  updateTeam();
  updateLeaderboard();
  updatePlant();
  updateChart();

  $("goalResult").textContent =
    "Target: " + data.goal + " ml/day";

  $("coffeeResult").textContent =
    data.coffee > 0
      ? data.coffee + " drink(s) logged. Extra target: " +
        data.coffee*200 + " ml."
      : "No caffeine drinks logged.";

  saveData();
}

/* INITIALIZE */

function initialize() {

  $("weight").value = data.weight;

  render();

  document.addEventListener("visibilitychange",() => {
    if (!document.hidden) render();
  });

}

initialize();