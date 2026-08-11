-- Ampliación de la lista para primerizos + pañales ilimitados

-- El regalo estrella para aportaciones pequeñas: nunca se agota
insert into public.gifts (name, description, price_hint, category, priority, unlimited) values
('Pañales y toallitas', 'El regalo que nunca sobra: trae un paquete de pañales (talla 1, 2 o 3) o toallitas. ¡Cuantos más, mejor! Perfecto si prefieres una aportación pequeña.', 'desde 10 €', 'Baño e higiene', 10, true);

insert into public.gifts (name, description, price_hint, category, priority) values
-- Alimentación
('Chupetes y portachupetes', 'Fisiológicos 0-6m, y una cadenita para que no acaben en el suelo.', '10–20 €', 'Alimentación', 4),
('Termo papillero y bolsa térmica', 'Para llevar comidas y biberones calientes en las salidas.', '20–35 €', 'Alimentación', 3),
('Trona de viaje plegable', 'De tela o plegable, para casas de los abuelos y restaurantes.', '25–50 €', 'Alimentación', 4),

-- Sueño
('Sábanas y protectores de cuna', 'Bajeras impermeables y sábanas suaves (mejor por duplicado).', '20–35 €', 'Sueño', 5),
('Arrullos / swaddles de velcro', 'Para envolverlo los primeros meses y que duerma más tranquilo.', '20–30 €', 'Sueño', 5),

-- Baño e higiene
('Canastilla para el hospital', 'Neceser con lo esencial de los primeros días: bodies, gorrito, manoplas, arrullo.', '25–50 €', 'Baño e higiene', 5),
('Aspirador nasal eléctrico', 'El manual se queda corto con los primeros resfriados.', '20–35 €', 'Salud y hogar', 4),

-- Juego
('Alfombra acolchada de juegos', 'Grande y lavable, para el suelo del salón: gateo y juego seguro.', '30–60 €', 'Juego', 6),
('Correpasillos de madera', 'Para cuando empiece a caminar (y de paso, decorativo).', '40–70 €', 'Juego', 3),

-- Recuerdos
('Álbum del primer año + kit de huellas', 'Álbum bonito para fotos y un kit de huella de mano/pie en arcilla.', '25–45 €', 'Recuerdos', 7),
('Sesión de fotos newborn', 'Una sesión con fotógrafo en los primeros 15 días. Se puede regalar entre varios.', '80–150 €', 'Recuerdos', 6),

-- Para los papás
('Tuppers de comida casera para el primer mes', 'El mejor regalo que nadie te cuenta: cocina algo rico y congelable para los papás zombis.', 'tu tiempo 💛', 'Para los papás', 8),
('Vale por una tarde de canguro', 'Un vale casero: te quedas con el peque unas horas y los papás se escapan a cenar.', 'tu tiempo 💛', 'Para los papás', 7),
('Libros para papás primerizos', 'Ej.: "El cerebro del niño", "Dormir sin lágrimas", "Bésame mucho"…', '15–25 €', 'Para los papás', 4);
