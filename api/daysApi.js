const API_URL = "https://backend-bus-duty-tracker-v2-1.onrender.com/days";

// GET
export async function fetchDays() {
  const response = await fetch(API_URL);
  const data = await response.json();
  return data;
}

// POST
export async function saveDay(day) {
  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(day),
  });
}

// EDIT
export async function updateDay(day) {
  try {
    const res = await fetch(
      `$https://backend-bus-duty-tracker-v2-1.onrender.com/days/${day.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(day),
      },
    );

    if (!res.ok) {
      throw new Error("Erreur serveur");
    }
  } catch (error) {
    console.error("Erreur updateDay:", error);
  }
}

// DELETE
export async function deleteDay(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
}
