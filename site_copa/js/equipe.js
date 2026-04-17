document.getElementById('form-contato').addEventListener('submit', function (e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const assunto = document.getElementById('assunto').value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();

    const corpo =
`Prezado(as),

${mensagem}

Atenciosamente,
${nome}`;

    const mailtoLink =
        `mailto:esportesemnumeros@gmail.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

    window.open(mailtoLink, '_blank');
});
