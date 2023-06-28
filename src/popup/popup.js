document.addEventListener('DOMContentLoaded', function () {
    const deckSelect = document.getElementById('deck');
    const fieldSelect = document.getElementById('field');
    const numberInput = document.getElementById('number');

    const deckNamesQuery = {
        action: "deckNames",
        version: 6,
    };

    fetch('http://localhost:8765', {
        method: 'POST',
        body: JSON.stringify(deckNamesQuery),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(response => response.json())
        .then(data => {
            for (let deck of data.result) {
                const option = document.createElement('option');
                option.text = deck;
                deckSelect.add(option);
            }

            // Restore saved deck selection
            if (localStorage.getItem('selectedDeck')) {
                deckSelect.value = localStorage.getItem('selectedDeck');
            }

            deckSelect.dispatchEvent(new Event('change'));
        });

    deckSelect.addEventListener('change', function () {
        const deck = deckSelect.value;

        const findCardsQuery = {
            action: "findCards",
            version: 6,
            params: {
                query: `deck:${deck}`,
            },
        };

        fetch('http://localhost:8765', {
            method: 'POST',
            body: JSON.stringify(findCardsQuery),
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(response => response.json())
            .then(data => {
                const cardsInfoQuery = {
                    action: "cardsInfo",
                    version: 6,
                    params: {
                        cards: [data.result[0]],
                    },
                };

                fetch('http://localhost:8765', {
                    method: 'POST',
                    body: JSON.stringify(cardsInfoQuery),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }).then(response => response.json())
                    .then(data => {
                        fieldSelect.innerHTML = '';
                        for (let field in data.result[0].fields) {
                            const option = document.createElement('option');
                            option.text = field;
                            fieldSelect.add(option);
                        }

                        // Restore saved field selection
                        if (localStorage.getItem('selectedField')) {
                            if (localStorage.getItem('selectedField') in data.result[0].fields) {
                                fieldSelect.value = localStorage.getItem('selectedField');
                            }
                        }
                    });
            });
    });

    // Restore saved number input
    if (localStorage.getItem('selectedNumber')) {
        numberInput.value = localStorage.getItem('selectedNumber');
    }
});

document.getElementById('query').addEventListener('click', function () {
    const deck = document.getElementById('deck').value;
    const field = document.getElementById('field').value;
    const number = document.getElementById('number').value;
    // Save selections
    localStorage.setItem('selectedDeck', deck);
    localStorage.setItem('selectedField', field);
    localStorage.setItem('selectedNumber', number);

    const findNotesQuery = {
        action: "findNotes",
        version: 6,
        params: {
            query: `deck:${deck}`,
        },
    };

    fetch('http://localhost:8765', {
        method: 'POST',
        body: JSON.stringify(findNotesQuery),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(response => response.json())
        .then(data => {
            const totalNotes = data.result;
            let noteIds = [];

            for (let i = 0; i < number; i++) {
                const randomIndex = Math.floor(Math.random() * totalNotes.length);
                noteIds.push(totalNotes[randomIndex]);
                totalNotes.splice(randomIndex, 1); // To avoid picking the same note twice
            }

            const notesInfoQuery = {
                action: "notesInfo",
                version: 6,
                params: {
                    notes: noteIds,
                },
            };

            fetch('http://localhost:8765', {
                method: 'POST',
                body: JSON.stringify(notesInfoQuery),
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(response => response.json())
                .then(data => {
                    let result = '';
                    let textToCopy = '';
                    for (let note of data.result) {
                        result += `<p>${note.fields[field].value}</p>`;
                        textToCopy += `${note.fields[field].value}\n`;
                    }
                    document.getElementById('result').innerHTML = result;
                    // Copy to clipboard
                    navigator.clipboard.writeText(textToCopy).then(function () {
                        console.log('Copying to clipboard was successful!');
                    }, function (err) {
                        console.error('Could not copy text: ', err);
                    });
                });
        });
});