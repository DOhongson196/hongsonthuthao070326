export const rsvp = (() => {

  const init = () => {
    const form = document.getElementById('rsvp-form');
    if (!form) return;
    form.addEventListener('submit', send);
  };

  const send = (e) => {
    e.preventDefault();

    const name = document.getElementById('rsvp-name')?.value.trim();
    const attendance = document.querySelector('input[name="rsvp"]:checked')?.value;
    const status = document.getElementById('rsvp-status');

    if (!name || !attendance) {
      show(status, 'Vui lòng nhập đầy đủ thông tin', 'danger');
      return;
    }

    show(status, 'Đang gửi xác nhận...', 'info');

    emailjs.send(
      'service_sldqha9',
      'template_u1b5vni',
      {
        name: name, // 👈 khớp {{name}}
        time: new Date().toLocaleString('vi-VN'), // 👈 khớp {{time}}
        message: `Trạng thái tham dự: ${attendance}`, // 👈 khớp {{message}}
      }
    )
    .then(() => {
      show(status, 'Cảm ơn bạn đã xác nhận 💖', 'success');
      e.target.reset();
    })
    .catch(() => {
      show(status, 'Gửi thất bại, vui lòng thử lại', 'danger');
    });
  };

  const show = (el, msg, type) => {
    el.classList.remove('d-none');
    el.className = `small mt-2 text-${type}`;
    el.innerText = msg;
  };

  return { init };
})();
