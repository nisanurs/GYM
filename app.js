 function idealKilo(cinsiyet, boy, kilo) {
    let ideal;

    if (cinsiyet === 'erkek') {
      ideal = 50 + 2.3 * ((boy / 2.54) - 60);
    } else if (cinsiyet === 'kadın') {
      ideal = 45.5 + 2.3 * ((boy / 2.54) - 60);
    } else {
      return "Cinsiyet 'erkek' veya 'kadın' olmalı.";
    }

    ideal = Number(ideal.toFixed(1));
    let mesaj = `İdeal kilonuz: ${ideal} kg. `;

    if (kilo > ideal) {
      mesaj += `${(kilo - ideal).toFixed(1)} kg vermelisiniz.`;
    } else if (kilo < ideal) {
      mesaj += `${(ideal - kilo).toFixed(1)} kg almalısınız.`;
    } else {
      mesaj += "Kilonuz ideal.";
    }

    return mesaj;
  }

  const form = document.getElementById('calculatorForm');

  form.addEventListener('submit', function(event) {
    event.preventDefault();

    const boy = Number(document.getElementById('boy').value);
    const kilo = Number(document.getElementById('kilo').value);
    const cinsiyetRadio = document.querySelector('input[name="cinsiyet"]:checked');
    const cinsiyet = cinsiyetRadio ? cinsiyetRadio.value : null;

    if (!cinsiyet) {
      alert('Lütfen cinsiyet seçiniz.');
      return;
    }

    const sonuc = idealKilo(cinsiyet, boy, kilo);
    document.getElementById('idealKiloSonuc').textContent = sonuc;
  });