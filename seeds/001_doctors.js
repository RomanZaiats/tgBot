const users = [
  {
    firstName: 'Світлана',
    lastName: 'Рудик',
    username: '',
    specialization: 'Гінеколог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Софія',
    lastName: 'Кархут',
    username: '',
    specialization: 'Дерматолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Анастасія',
    lastName: 'Ткачук',
    username: '',
    specialization: 'Дієтолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Орися',
    lastName: 'Ліщук',
    username: '',
    specialization: 'Ендокринолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Оксана',
    lastName: 'Кондрацька',
    username: '',
    specialization: 'Кардіолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Марія',
    lastName: 'Драганчук',
    username: '',
    specialization: 'Косметолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Володимир',
    lastName: 'Горак',
    username: '',
    specialization: 'ЛОР',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Олександр',
    lastName: 'Ковешніков',
    username: '',
    specialization: 'Мамолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Ірина',
    lastName: 'Шишлова',
    username: '',
    specialization: 'Масажист',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Василь',
    lastName: 'Качараль',
    username: '',
    specialization: 'Невропатолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Ігор',
    lastName: 'Гресько',
    username: '',
    specialization: 'Ортопед-травматолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Наталія',
    lastName: 'Паламаренко-Велика',
    username: '',
    specialization: 'Офтальмолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Наталія',
    lastName: 'Канюка',
    username: '',
    specialization: 'Педіатр',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Уляна',
    lastName: 'Царица',
    username: '',
    specialization: 'Проктолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Віра',
    lastName: 'Грабельська',
    username: '',
    specialization: 'Психіатр',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Ірина',
    lastName: 'Нестерова',
    username: '',
    specialization: 'Психолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Уляна',
    lastName: 'Криницька-Березюк',
    username: '',
    specialization: 'Психотерапевт',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Марта',
    lastName: 'Довгань',
    username: '',
    specialization: 'Ревматолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Ольга',
    lastName: 'Дворак',
    username: '',
    specialization: 'Сімейний лікар',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Тетяна',
    lastName: 'Філіпська',
    username: '',
    specialization: 'Стоматолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Наталія',
    lastName: 'Лізанець',
    username: '',
    specialization: 'Терапевт',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Наталія',
    lastName: 'Симочко',
    username: '',
    specialization: 'Терапевт',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Софія',
    lastName: 'Кархут',
    username: '',
    specialization: 'Трихолог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Юрій',
    lastName: 'Семчишин',
    username: '',
    specialization: 'Уролог',
    address: '49.828078757989495, 23.99464819838853'
  },
  {
    firstName: 'Мар’яна',
    lastName: 'Курса',
    username: '',
    specialization: 'Фізичний реабілітолог',
    address: '49.828078757989495, 23.99464819838853'
  },
];

exports.seed = async (knex) => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const { firstName, lastName, specialization, address } = user;
    const r = await knex('users')
      .first('id')
      .where({ firstName, lastName });
    if (!r) {
      const [{ id }] = await knex('users').insert({
        firstName,
        lastName,
        username: '-',
        isDoctor: true
      }, ['id']);

      await knex('doctors').insert({
        userId: id,
        address,
        specialization
      });
    }
  }
};