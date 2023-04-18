document.getElementById('alert').style.display = 'none';
const urlParams = new URLSearchParams(window.location.search);
const statusalert = urlParams.get('status');

var alertText;

if (statusalert == 'insert-success') {
    setAlert('Successfully Inserted Data', 'success');
} else if (statusalert == 'insert-error') {
    setAlert('Could not create a user with the given credentials', 'error');
} else if (statusalert == 'retrieve-error') {
    setAlert('Failed to Retrieve Data', 'error');
} else if (statusalert == 'username-error') {
    setAlert('No User Exists With the Provided Username', 'error');
} else if (statusalert == 'missing-data') {
    setAlert('All fields must be filled out', 'warning');
} else if (statusalert == 'bad-data') {
    setAlert('Invalid input', 'error');
}

function setAlert(alertText, alertType) {
    document.getElementById('alert').innerHTML = `${alertText}<button type="button" class="btn-close float-end" data-bs-dismiss="alert" aria-label="Close" style="align-item: right;"></button>`;
    if (alertType == 'error') {
        document.getElementById('alert').style['background-color'] = '#FF6969'; // error
    } else if (alertType == 'warning') {
        document.getElementById('alert').style['background-color'] = '#FFB347'; // warning
    } else {
        document.getElementById('alert').style['background-color'] = '#5CB85C'; // success
    }
    document.getElementById('alert').style.display = 'block';
}

window.history.replaceState('returned page to base url', '', `${window.location.href.split('?')[0]}`);