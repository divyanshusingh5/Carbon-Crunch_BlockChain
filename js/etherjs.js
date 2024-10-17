<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Figma Plugin</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        textarea {
            width: 100%;
            height: 200px;
        }
        button {
            margin-top: 10px;
            padding: 10px;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <h2>Enter JSON Data</h2>
    <textarea id="jsonInput" placeholder='[{"name":"Rectangle 1", "type":"RECTANGLE", "node":{...}}, ...]'></textarea>
    <button id="renderButton">Render</button>
    <script>
        document.getElementById('renderButton').onclick = () => {
            const jsonInput = document.getElementById('jsonInput').value;
            // Send the JSON input to the main code
            parent.postMessage({ pluginMessage: { type: 'render', json: jsonInput } }, '*');
        };
    </script>
</body>
</html>
