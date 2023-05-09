DECLARE @id INT
DECLARE @name VARCHAR(50)
DECLARE cursor_name CURSOR FOR 
    SELECT id, name FROM CUR
OPEN cursor_name
FETCH NEXT FROM cursor_name INTO @id, @name
WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT 'ID: ' + CAST(@id AS VARCHAR(10)) + ', Name: ' + @name
    FETCH NEXT FROM cursor_name INTO @id, @name
END
CLOSE cursor_name
DEALLOCATE cursor_name
