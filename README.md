<!DOCTYPE html>
<html>
<head>
    <title>blza.me</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
</head>
<body>
    <h1>Bem-vindo ao blza.me!</h1>
    <form id="shorten-form">
        <input type="url" id="url" placeholder="Insira sua URL aqui" required>
        <input type="text" id="custom-id" placeholder="ID personalizado (opcional)">
        <button type="submit">Encurtar URL</button>
    </form>
    <p id="result"></p>
    <script>
        $('#shorten-form').on('submit', function(e) {
            e.preventDefault();
            $.ajax({
                url: '/shorten',
                method: 'POST',
                data: {
                    url: $('#url').val(),
                    customShortId: $('#custom-id').val()
                },
                success: function(data) {
                    $('#result').text('URL Encurtada: ' + data.urlShort);
                },
                error: function(err) {
                    $('#result').text('Erro: ' + err.responseText);
                }
            });
        });
    </script>
</body>
</html>
