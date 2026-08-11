-- Lista inicial de aproximación (editable desde /admin.html)
-- Excluye lo que ya hay: silla de coche, parque-cuna, cama montessori,
-- cojín de lactancia, bañera y silla de comer.

insert into public.gifts (name, description, price_hint, category, priority) values
-- Paseo y porteo
('Mochila de porteo ergonómica', 'Para llevar al peque pegadito en paseos y casa. Ej.: Ergobaby Omni, BabyBjörn Harmony o Boba X.', '90–180 €', 'Paseo y porteo', 10),
('Fular elástico de porteo', 'Ideal para los primeros meses, recién nacido. Ej.: Boba Wrap o Koala Babycare.', '35–60 €', 'Paseo y porteo', 5),
('Bolso / mochila de pañales', 'Con cambiador plegable incluido y muchos bolsillos.', '40–80 €', 'Paseo y porteo', 8),
('Saco para silla de paseo', 'Para el invierno, universal e impermeable.', '40–70 €', 'Paseo y porteo', 4),
('Sombrilla y protector de lluvia para el carrito', 'Para paseos con sol o lluvia.', '20–40 €', 'Paseo y porteo', 3),

-- Sueño
('Vigilabebés con cámara', 'Con visión nocturna y sensor de temperatura. Ej.: Philips Avent o Motorola.', '60–150 €', 'Sueño', 10),
('Sacos de dormir (pack 0-6m y 6-12m)', 'Más seguros que las mantas. Distintos grosores (TOG) según temporada.', '25–45 € c/u', 'Sueño', 9),
('Luz nocturna con ruido blanco', 'Ayuda a dormir y a las tomas nocturnas. Ej.: Zazu, Momcozy.', '25–50 €', 'Sueño', 6),
('Móvil musical para la cuna', 'Con melodías suaves y movimiento.', '25–45 €', 'Sueño', 4),
('Pack de muselinas de algodón', 'Multiusos: arrullo, sombra, eructos… nunca sobran.', '15–30 €', 'Sueño', 7),

-- Alimentación
('Set de biberones anticólicos', 'Ej.: Philips Avent, MAM o Suavinex, con tetinas de flujo lento.', '25–50 €', 'Alimentación', 8),
('Esterilizador de biberones', 'De vapor eléctrico o para microondas.', '30–70 €', 'Alimentación', 6),
('Calientabiberones', 'Rápido y con función descongelar.', '25–45 €', 'Alimentación', 4),
('Sacaleches eléctrico', 'Doble o portátil. Ej.: Medela, Momcozy.', '80–180 €', 'Alimentación', 7),
('Robot de cocina para papillas', 'Cuece al vapor y tritura, para la alimentación complementaria. Ej.: Avent 4 en 1.', '80–130 €', 'Alimentación', 4),
('Baberos y vajilla de aprendizaje', 'Baberos impermeables, cuencos con ventosa y cubiertos blanditos.', '15–30 €', 'Alimentación', 3),

-- Baño e higiene
('Cambiador portátil', 'Para cambios fuera de casa.', '15–30 €', 'Baño e higiene', 5),
('Set de higiene del bebé', 'Cortauñas, cepillo suave, aspirador nasal, termómetro de baño.', '15–30 €', 'Baño e higiene', 6),
('Capas de baño y toallas con capucha', 'Suaves, de algodón o bambú.', '15–35 €', 'Baño e higiene', 4),

-- Salud y hogar
('Termómetro digital sin contacto', 'De frente/oído, rápido para cuando duermen.', '25–50 €', 'Salud y hogar', 7),
('Humidificador para la habitación', 'Para los meses de calefacción y mocos.', '30–60 €', 'Salud y hogar', 5),
('Kit de seguridad para el hogar', 'Protectores de esquinas, tapa-enchufes, cierres de cajones… para cuando gatee.', '15–30 €', 'Salud y hogar', 3),

-- Juego y estimulación
('Gimnasio de actividades / manta de juegos', 'Con arcos, espejo y texturas. Ej.: Fisher-Price, Lovevery.', '40–90 €', 'Juego', 9),
('Hamaca o balancín', 'Para tenerlo cerca y entretenido mientras cocináis. Ej.: BabyBjörn Balance.', '60–200 €', 'Juego', 6),
('Juguetes sensoriales y sonajeros', 'Mordedores, sonajeros de madera, pelota Montessori…', '10–25 €', 'Juego', 5),
('Libros de tela y de contraste', 'Blanco y negro para los primeros meses.', '10–20 €', 'Juego', 4),
('Doudou / muñeco de apego', 'Suave y lavable (mejor dos iguales, por si se pierde 😉).', '15–25 €', 'Juego', 5),

-- Ropa
('Ropa 0-6 meses', 'Bodies, pijamas y ranitas. Crece rapidísimo: mejor variedad de tallas.', '15–40 €', 'Ropa', 6),
('Ropa 6-12 meses', 'La talla que nadie regala y luego hace falta.', '15–40 €', 'Ropa', 6);
