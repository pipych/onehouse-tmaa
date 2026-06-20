useEffect(() => {
    let attempts = 0;
    const initTMA = async () => {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();

        const userFromTg = tg.initDataUnsafe?.user;

        if (!userFromTg || !userFromTg.id) {
          setError('Приложение запущено вне Telegram или данные профиля недоступны.');
          setLoading(false);
          return;
        }

        setTgUser(userFromTg);

        try {
          const { data: user, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('tg_id', userFromTg.id)
            .single();

          if (dbError || !user) {
            setError(`Пользователь с TG ID ${userFromTg.id} не найден в базе Supabase. Добавь запись в таблицу users.`);
          } else {
            setDbUser(user);
            setNewRpName(user.rp_name);
            loadPlayers();
            loadConstitution();
          }
        } catch (e: any) {
          setError(`Ошибка базы данных: ${e.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        attempts++;
        if (attempts > 15) {
          setError('Telegram WebApp не обнаружен. Открывай Mini App строго внутри Telegram.');
          setLoading(false);
        } else {
          setTimeout(initTMA, 200);
        }
      }
    };

    initTMA();
  }, []);
