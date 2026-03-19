export const deutscheVornamen = {
	m: ['Thomas', 'Michael', 'Stefan', 'Andreas', 'Christian', 'Martin', 'Markus', 'Daniel', 'Peter', 'Frank', 'Jan', 'Jens', 'Sven', 'Uwe', 'Lars', 'Tobias', 'Felix', 'Lukas', 'Tim', 'Maximilian', 'Paul', 'Leon', 'Jonas', 'Bernd', 'Klaus', 'Wolfgang', 'Rainer', 'Dieter', 'Holger', 'Carsten'],
	w: ['Sabine', 'Andrea', 'Claudia', 'Petra', 'Susanne', 'Monika', 'Katrin', 'Julia', 'Anna', 'Maria', 'Sandra', 'Nicole', 'Stefanie', 'Christine', 'Birgit', 'Martina', 'Karin', 'Heike', 'Simone', 'Laura', 'Lena', 'Sophie', 'Emma', 'Lisa', 'Hannah', 'Renate', 'Brigitte', 'Ingrid', 'Ursula', 'Gisela']
};

export const tuerkischeVornamen = {
	m: ['Mehmet', 'Ali', 'Mustafa', 'Emre', 'Can', 'Yusuf', 'Hasan', 'Ahmet', 'Kemal', 'Burak', 'Murat', 'Serkan', 'Osman', 'Ibrahim', 'Deniz'],
	w: ['Ayşe', 'Fatma', 'Elif', 'Zeynep', 'Hatice', 'Emine', 'Merve', 'Esra', 'Derya', 'Gülcan', 'Leyla', 'Selin', 'Nur', 'Şeyma', 'Dilara']
};

export const arabischeVornamen = {
	m: ['Mohammed', 'Ahmad', 'Omar', 'Hassan', 'Karim', 'Yousef', 'Fadi', 'Nabil', 'Samir', 'Tariq', 'Bilal', 'Khalid', 'Amir', 'Rami', 'Sami'],
	w: ['Fatima', 'Amira', 'Layla', 'Nour', 'Hana', 'Sara', 'Yasmin', 'Rania', 'Dina', 'Maryam', 'Aisha', 'Lina', 'Dana', 'Rana', 'Salma']
};

export const polnischeVornamen = {
	m: ['Piotr', 'Krzysztof', 'Andrzej', 'Tomasz', 'Marcin', 'Paweł', 'Michał', 'Marek', 'Jakub', 'Adam', 'Łukasz', 'Kamil', 'Rafał', 'Wojciech', 'Dawid'],
	w: ['Anna', 'Katarzyna', 'Agnieszka', 'Małgorzata', 'Magdalena', 'Joanna', 'Monika', 'Beata', 'Ewa', 'Dorota', 'Natalia', 'Karolina', 'Aleksandra', 'Patrycja', 'Justyna']
};

export const russischeVornamen = {
	m: ['Dmitri', 'Alexander', 'Sergej', 'Andrej', 'Nikolai', 'Wladimir', 'Igor', 'Maxim', 'Oleg', 'Viktor', 'Iwan', 'Boris', 'Alexej', 'Pavel', 'Roman'],
	w: ['Olga', 'Natalia', 'Irina', 'Jekaterina', 'Tatjana', 'Swetlana', 'Marina', 'Elena', 'Ludmila', 'Anastasia', 'Galina', 'Valentina', 'Larisa', 'Oksana', 'Daria']
};

export const vietnamesischeVornamen = {
	m: ['Minh', 'Duc', 'Huy', 'Quang', 'Tuan', 'Long', 'Hai', 'Nam', 'Dung', 'Thanh'],
	w: ['Linh', 'Trang', 'Huong', 'Thao', 'Lan', 'Mai', 'Nga', 'Phuong', 'Hoa', 'Thu']
};

export type HerkunftsRegion = 'deutsch' | 'türkisch' | 'arabisch' | 'polnisch' | 'russisch' | 'vietnamesisch';

const namenMap: Record<HerkunftsRegion, { m: string[]; w: string[] }> = {
	deutsch: deutscheVornamen,
	türkisch: tuerkischeVornamen,
	arabisch: arabischeVornamen,
	polnisch: polnischeVornamen,
	russisch: russischeVornamen,
	vietnamesisch: vietnamesischeVornamen
};

export function getVorname(herkunft: HerkunftsRegion, geschlecht: 'm' | 'w'): string {
	const namen = namenMap[herkunft]?.[geschlecht] ?? deutscheVornamen[geschlecht];
	return namen[Math.floor(Math.random() * namen.length)];
}

const nachnamenInitialen = 'ABCDEFGHIJKLMNOPRSTUWYZ';

export function getNachnameInitial(): string {
	return nachnamenInitialen[Math.floor(Math.random() * nachnamenInitialen.length)] + '.';
}
