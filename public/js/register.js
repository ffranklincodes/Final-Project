async function loadRoleForm() {
    console.log("loadRoleForm called");
    const role = document.getElementById("role").value;
    console.log("role-selected:", role);
    const response = await fetch(`/register/${role}-form`);
    const html = await response.text();
    document.getElementById("role-form").innerHTML = html;
}